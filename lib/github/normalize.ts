// Pure mappers: GitHub API payloads -> normalized Activity rows.
// Each carries `url` (provenance) and a stable `externalId` for idempotent upserts.

export type ActivityType = "repo" | "pull_request" | "issue" | "org";

export interface NormalizedActivity {
  provider: "github";
  type: ActivityType;
  externalId: string;
  title: string;
  body: string | null;
  url: string;
  metrics: string | null; // JSON text
  occurredAt: Date | null;
  raw: string; // JSON text
}

export interface RepoInput {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  fork: boolean;
  owner: { login: string };
}

export interface IssueInput {
  id: number;
  title: string;
  html_url: string;
  body?: string | null;
  state: string;
  comments: number;
  created_at: string;
  closed_at?: string | null;
  repository_url?: string;
}

export interface OrgInput {
  id: number;
  login: string;
  description?: string | null;
}

export function normalizeRepo(repo: RepoInput): NormalizedActivity {
  return {
    provider: "github",
    type: "repo",
    externalId: `repo:${repo.id}`,
    title: repo.full_name,
    body: repo.description,
    url: repo.html_url,
    metrics: JSON.stringify({
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      fork: repo.fork,
    }),
    // Recency of the work, not repo creation: prefer last push.
    occurredAt: toDate(repo.pushed_at ?? repo.updated_at),
    raw: JSON.stringify({
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      html_url: repo.html_url,
      owner: repo.owner.login,
    }),
  };
}

export function normalizeIssueOrPr(
  item: IssueInput,
  type: "pull_request" | "issue",
): NormalizedActivity {
  return {
    provider: "github",
    type,
    externalId: `${type}:${item.id}`,
    title: item.title,
    body: item.body ?? null,
    url: item.html_url,
    metrics: JSON.stringify({
      state: item.state,
      comments: item.comments,
      repo: repoFromApiUrl(item.repository_url),
    }),
    // Closed work is the accomplishment; fall back to creation for open items.
    occurredAt: toDate(item.closed_at ?? item.created_at),
    raw: JSON.stringify({
      title: item.title,
      state: item.state,
      html_url: item.html_url,
      repository_url: item.repository_url ?? null,
    }),
  };
}

export function normalizeOrg(org: OrgInput): NormalizedActivity {
  return {
    provider: "github",
    type: "org",
    externalId: `org:${org.id}`,
    title: org.login,
    body: org.description ?? null,
    url: `https://github.com/${org.login}`,
    metrics: null,
    occurredAt: null,
    raw: JSON.stringify({ login: org.login, description: org.description ?? null }),
  };
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "https://api.github.com/repos/acme/widgets" -> "acme/widgets" */
function repoFromApiUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/repos\/([^/]+\/[^/]+)$/);
  return m ? m[1] : null;
}

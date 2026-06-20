// Pure prompt construction for resume synthesis. No imports beyond types so
// this stays trivially unit-testable (no network, no DB, no SDK).

export type ActivityLite = {
  type: string;
  title: string;
  body: string | null;
  url: string;
  metrics: string | null;
  occurredAt: Date | null;
};

const BODY_MAX = 280;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  // Reserve one char for the ellipsis so the result never exceeds `max`.
  return `${trimmed.slice(0, max - 1).trimEnd()}\u2026`;
}

type MetricsHint = {
  repo?: string;
  language?: string;
  stars?: number;
  additions?: number;
  deletions?: number;
};

function parseMetrics(raw: string | null): MetricsHint {
  if (!raw) return {};
  try {
    const m = JSON.parse(raw) as Record<string, unknown>;
    const hint: MetricsHint = {};
    if (typeof m.repo === "string") hint.repo = m.repo;
    if (typeof m.language === "string") hint.language = m.language;
    if (typeof m.stars === "number") hint.stars = m.stars;
    if (typeof m.additions === "number") hint.additions = m.additions;
    if (typeof m.deletions === "number") hint.deletions = m.deletions;
    return hint;
  } catch {
    return {};
  }
}

/**
 * Serialize a single activity into a compact, model-friendly line, surfacing the
 * signal the model needs to group by project and infer project metadata
 * (repo, language, stars, diff size).
 */
function serializeActivity(a: ActivityLite): string {
  const parts = [`- [${a.type}] ${a.title.trim()}`];
  const m = parseMetrics(a.metrics);
  if (m.repo) parts.push(`repo=${m.repo}`);
  if (m.language) parts.push(`lang=${m.language}`);
  if (typeof m.stars === "number") parts.push(`stars=${m.stars}`);
  if (m.additions !== undefined || m.deletions !== undefined) {
    parts.push(`diff=+${m.additions ?? 0}/-${m.deletions ?? 0}`);
  }
  const y = a.occurredAt ? String(a.occurredAt.getUTCFullYear()) : "";
  if (y) parts.push(`(${y})`);
  parts.push(`<${a.url}>`);
  let line = parts.join(" ");
  if (a.body && a.body.trim()) {
    line += `\n  ${truncate(a.body, BODY_MAX)}`;
  }
  return line;
}

/**
 * Build the system + user messages that ask the model to synthesize a resume.
 * The system message pins the output contract (project-grouped ResumeDraft);
 * the user message carries the curated activity log.
 */
export function buildResumePrompt(input: {
  name: string;
  activities: ActivityLite[];
  targetRole?: string;
}): { system: string; user: string } {
  const system = [
    "You are an expert technical resume writer.",
    "You transform a developer's raw work activity (GitHub repos, pull requests, issues, org memberships) into a concise, high-impact resume.",
    "Curate aggressively: deduplicate overlapping work and rewrite each entry as a results-oriented accomplishment bullet (lead with impact, quantify where the evidence supports it). Never invent facts not grounded in the provided activity.",
    "",
    "GROUP every accomplishment by its project. A project is normally a repository — use a clean display name (e.g. 'acme/widgets' may render as 'widgets'). Cross-repository or profile-level work goes under the project 'Open Source'.",
    "For each item set 'projectMeta': a short descriptor combining role (Maintainer/Contributor/Author), star count, and primary language(s) when the activity supports it, e.g. 'Maintainer \u00b7 4.2k\u2605 \u00b7 TypeScript, Go'. Set 'projectUrl' to the repo (or profile) URL.",
    "Also produce 'skills': 3-4 labeled groups (e.g. Languages, Infrastructure, Focus), each 'list' a comma-separated string inferred from the activity.",
    "Cite the source of every item by listing the relevant activity url(s) in its evidenceUrls array.",
    "",
    "Match this ResumeDraft shape exactly:",
    '{ "headline": string, "summary": string, "skills": [ { "label": string, "list": string } ], "items": [ { "project": string, "projectMeta": string, "projectUrl": string, "content": string, "evidenceUrls": string[] } ] }',
    '"headline" is a one-line professional title; "summary" is a short professional summary paragraph.',
  ].join("\n");

  const name = input.name.trim();
  const header = name
    ? `Candidate: ${name}`
    : "Candidate name: (unknown \u2014 omit personal name from the resume)";

  const body =
    input.activities.length > 0
      ? input.activities.map(serializeActivity).join("\n")
      : "(no activity available)";

  const role = input.targetRole?.trim();
  const roleLine = role
    ? `Target role: ${role}\nTailor the résumé toward this role — prioritize the most relevant work, phrase accomplishments to match it, and order items by relevance.`
    : null;

  const user = [header, ...(roleLine ? ["", roleLine] : []), "", "Activity log:", body, "", "Produce the ResumeDraft now."].join("\n");

  return { system, user };
}

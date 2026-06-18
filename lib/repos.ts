import { prisma } from "@/lib/prisma";

type ActivityLike = { type: string; title: string; metrics: string | null };

/** The "owner/name" slug an activity belongs to, or null (e.g. orgs). */
export function repoSlugOf(a: ActivityLike): string | null {
  if (a.type === "repo") return a.title;
  if (a.metrics) {
    try {
      const m = JSON.parse(a.metrics) as Record<string, unknown>;
      if (typeof m.repo === "string") return m.repo;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function ownerOf(slug: string): string {
  return slug.split("/")[0];
}

export interface IgnoreSets {
  repos: Set<string>;
  orgs: Set<string>;
}

export async function ignoreSets(userId: string): Promise<IgnoreSets> {
  const [repos, orgs] = await Promise.all([
    prisma.ignoredRepo.findMany({ where: { userId }, select: { repo: true } }),
    prisma.ignoredOrg.findMany({ where: { userId }, select: { org: true } }),
  ]);
  return {
    repos: new Set(repos.map((r) => r.repo)),
    orgs: new Set(orgs.map((o) => o.org)),
  };
}

function isIgnored(a: ActivityLike, sets: IgnoreSets): boolean {
  if (a.type === "org") return sets.orgs.has(a.title);
  const slug = repoSlugOf(a);
  if (!slug) return false;
  return sets.repos.has(slug) || sets.orgs.has(ownerOf(slug));
}

/** Drop activities belonging to an ignored repo or org (others pass). */
export function filterIgnored<T extends ActivityLike>(rows: T[], sets: IgnoreSets): T[] {
  if (sets.repos.size === 0 && sets.orgs.size === 0) return rows;
  return rows.filter((a) => !isIgnored(a, sets));
}

export type RepoRow = {
  repo: string;
  language: string | null;
  stars: number | null;
  ignored: boolean;
};

export async function loadRepos(userId: string): Promise<RepoRow[]> {
  const [repos, sets] = await Promise.all([
    prisma.activity.findMany({
      where: { userId, type: "repo" },
      select: { title: true, metrics: true },
      orderBy: [{ occurredAt: "desc" }],
    }),
    ignoreSets(userId),
  ]);

  return repos.map((r) => {
    let language: string | null = null;
    let stars: number | null = null;
    try {
      const m = JSON.parse(r.metrics ?? "{}") as Record<string, unknown>;
      if (typeof m.language === "string") language = m.language;
      if (typeof m.stars === "number") stars = m.stars;
    } catch {
      /* ignore */
    }
    return {
      repo: r.title,
      language,
      stars,
      ignored: sets.repos.has(r.title) || sets.orgs.has(ownerOf(r.title)),
    };
  });
}

export type OrgRow = { org: string; ignored: boolean };

/** Distinct owners across the user's activity (orgs they belong to + repo owners). */
export async function loadOrgs(userId: string): Promise<OrgRow[]> {
  const [acts, sets, connection] = await Promise.all([
    prisma.activity.findMany({
      where: { userId },
      select: { type: true, title: true, metrics: true },
    }),
    ignoreSets(userId),
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { handle: true },
    }),
  ]);

  const owners = new Set<string>();
  for (const a of acts) {
    if (a.type === "org") owners.add(a.title);
    else {
      const slug = repoSlugOf(a);
      if (slug) owners.add(ownerOf(slug));
    }
  }
  // Don't offer to "ignore" your own account.
  if (connection?.handle) owners.delete(connection.handle);

  return [...owners]
    .sort((a, b) => a.localeCompare(b))
    .map((org) => ({ org, ignored: sets.orgs.has(org) }));
}

import { prisma } from "@/lib/prisma";

/** The "owner/name" slug an activity belongs to, or null (e.g. orgs). */
export function repoSlugOf(a: {
  type: string;
  title: string;
  metrics: string | null;
}): string | null {
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

export async function ignoredRepoSet(userId: string): Promise<Set<string>> {
  const rows = await prisma.ignoredRepo.findMany({
    where: { userId },
    select: { repo: true },
  });
  return new Set(rows.map((r) => r.repo));
}

/** Keep only activities whose repo is not in the ignore set (non-repo rows pass). */
export function filterIgnored<T extends { type: string; title: string; metrics: string | null }>(
  rows: T[],
  ignored: Set<string>,
): T[] {
  if (ignored.size === 0) return rows;
  return rows.filter((r) => {
    const slug = repoSlugOf(r);
    return !slug || !ignored.has(slug);
  });
}

export type RepoRow = {
  repo: string;
  language: string | null;
  stars: number | null;
  ignored: boolean;
};

export async function loadRepos(userId: string): Promise<RepoRow[]> {
  const [repos, ignored] = await Promise.all([
    prisma.activity.findMany({
      where: { userId, type: "repo" },
      select: { title: true, metrics: true },
      orderBy: [{ occurredAt: "desc" }],
    }),
    ignoredRepoSet(userId),
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
    return { repo: r.title, language, stars, ignored: ignored.has(r.title) };
  });
}

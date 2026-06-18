import { prisma } from "@/lib/prisma";

export type ActivityStat = { n: string; label: string };
export type RecentItem = {
  id: string;
  title: string;
  type: string;
  repo: string;
  dot: string;
  url: string;
};
export type ActivityView = {
  total: number;
  stats: ActivityStat[];
  recent: RecentItem[];
  lastSyncAt: Date | null;
};

const TYPE_LABEL: Record<string, string> = {
  pull_request: "merged pr",
  issue: "issue",
  repo: "repo",
  org: "org",
};

function langOf(metrics: string | null): string | null {
  if (!metrics) return null;
  try {
    const m = JSON.parse(metrics) as Record<string, unknown>;
    return typeof m.language === "string" && m.language ? m.language : null;
  } catch {
    return null;
  }
}

function repoOf(title: string, metrics: string | null): string {
  if (metrics) {
    try {
      const m = JSON.parse(metrics) as Record<string, unknown>;
      if (typeof m.repo === "string") return m.repo;
    } catch {
      /* fall through */
    }
  }
  return title;
}

export async function loadActivity(userId: string): Promise<ActivityView> {
  const [byType, repos, recent, connection, total] = await Promise.all([
    prisma.activity.groupBy({ by: ["type"], where: { userId }, _count: { _all: true } }),
    prisma.activity.findMany({ where: { userId, type: "repo" }, select: { metrics: true } }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: [{ occurredAt: "desc" }],
      take: 8,
      select: { id: true, title: true, type: true, url: true, metrics: true },
    }),
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { lastSyncAt: true },
    }),
    prisma.activity.count({ where: { userId } }),
  ]);

  const countOf = (type: string): number =>
    byType.find((b) => b.type === type)?._count._all ?? 0;

  const languages = new Set<string>();
  for (const r of repos) {
    const lang = langOf(r.metrics);
    if (lang) languages.add(lang);
  }

  const stats: ActivityStat[] = [
    { n: String(countOf("pull_request")), label: "merged PRs" },
    { n: String(countOf("issue")), label: "issues" },
    { n: String(countOf("repo")), label: "repositories" },
    { n: String(countOf("org")), label: "organizations" },
    { n: String(languages.size), label: "languages" },
  ];

  return {
    total,
    stats,
    recent: recent.map((a) => ({
      id: a.id,
      title: a.title,
      type: TYPE_LABEL[a.type] ?? a.type,
      repo: repoOf(a.title, a.metrics),
      dot: a.type === "issue" ? "#f59e0b" : "#16a34a",
      url: a.url,
    })),
    lastSyncAt: connection?.lastSyncAt ?? null,
  };
}

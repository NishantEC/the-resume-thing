import { prisma } from "@/lib/prisma";

export type SourceConnection = {
  provider: string;
  label: string;
  handle: string | null;
  lastSyncAt: Date | null;
  count: number;
};

/** Display names for known providers; unknown providers fall back to their id. */
const LABELS: Record<string, string> = {
  github: "GitHub",
  linear: "Linear",
  jira: "Jira",
  asana: "Asana",
};

/** Connected sources for a user, each with its activity count + last sync. */
export async function loadConnections(userId: string): Promise<SourceConnection[]> {
  const [conns, counts] = await Promise.all([
    prisma.connection.findMany({
      where: { userId },
      select: { provider: true, handle: true, lastSyncAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activity.groupBy({
      by: ["provider"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countByProvider = new Map<string, number>();
  for (const c of counts) countByProvider.set(c.provider, c._count._all);

  return conns.map((c) => ({
    provider: c.provider,
    label: LABELS[c.provider] ?? c.provider,
    handle: c.handle,
    lastSyncAt: c.lastSyncAt,
    count: countByProvider.get(c.provider) ?? 0,
  }));
}

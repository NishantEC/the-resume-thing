import { prisma } from "@/lib/prisma";
import { syncGithub } from "@/lib/github/ingest";
import { syncLinear } from "@/lib/linear/ingest";
import { synthesizeResume } from "@/lib/synthesis/synthesize";
import type { SyncResult } from "./types";

export interface MultiSyncResult {
  byProvider: Record<string, number>;
  total: number;
}

/** Source adapters by provider id (static set of supported sources). */
const ADAPTERS: Record<string, (userId: string, since?: Date) => Promise<SyncResult>> = {
  github: syncGithub,
  linear: syncLinear,
};

/**
 * Sync every source the user has connected (an OAuth Account exists for it),
 * delta from each source's last successful sync. A failing source is logged
 * and skipped so one broken connection never blocks the others.
 */
export async function syncAllSources(userId: string): Promise<MultiSyncResult> {
  const [accounts, conns] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { providerId: true } }),
    prisma.connection.findMany({ where: { userId }, select: { provider: true, lastSyncAt: true } }),
  ]);
  const lastSync = new Map<string, Date | null>(conns.map((c) => [c.provider, c.lastSyncAt]));

  const byProvider: Record<string, number> = {};
  for (const { providerId } of accounts) {
    const adapter = ADAPTERS[providerId];
    if (!adapter) continue;
    try {
      const r = await adapter(userId, lastSync.get(providerId) ?? undefined);
      byProvider[providerId] = r.imported;
    } catch (err) {
      console.error(`[sync] ${providerId} failed for ${userId}:`, err);
    }
  }
  const total = Object.values(byProvider).reduce((a, b) => a + b, 0);
  return { byProvider, total };
}

/**
 * One worker pass: for every user with a connected source, pull deltas from all
 * their sources then run additive synthesis (which only drafts NEW suggestions
 * and never clobbers decisions or edited LaTeX).
 */
export async function runSyncPass(): Promise<{ users: number; imported: number }> {
  const accounts = await prisma.account.findMany({
    where: { providerId: { in: ["github", "linear"] } },
    select: { userId: true },
    distinct: ["userId"],
  });
  let imported = 0;
  for (const { userId } of accounts) {
    try {
      const r = await syncAllSources(userId);
      imported += r.total;
      const recent = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      if (recent) await synthesizeResume(recent.id);
    } catch (err) {
      console.error(`[worker] user ${userId} failed:`, err);
    }
  }
  return { users: accounts.length, imported };
}

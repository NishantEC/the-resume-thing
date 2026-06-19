import { prisma } from "@/lib/prisma";
import type { ActivityRow } from "./types";

/**
 * Idempotently upsert normalized activity rows (keyed by provider+type+externalId)
 * and return counts by type. Shared across source adapters.
 */
export async function upsertActivities(
  userId: string,
  rows: ActivityRow[],
): Promise<Record<string, number>> {
  const byType: Record<string, number> = {};
  for (const a of rows) {
    await prisma.activity.upsert({
      where: {
        provider_type_externalId: { provider: a.provider, type: a.type, externalId: a.externalId },
      },
      create: { ...a, userId },
      update: {
        title: a.title,
        body: a.body,
        url: a.url,
        metrics: a.metrics,
        occurredAt: a.occurredAt,
        raw: a.raw,
      },
    });
    byType[a.type] = (byType[a.type] ?? 0) + 1;
  }
  return byType;
}

/** Record a successful source sync by creating/refreshing the user's Connection row. */
export async function recordConnection(
  userId: string,
  provider: string,
  externalId: string,
  handle: string,
): Promise<void> {
  await prisma.connection.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, externalId, handle, lastSyncAt: new Date() },
    update: { lastSyncAt: new Date(), externalId, handle },
  });
}

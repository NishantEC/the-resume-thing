import { prisma } from "@/lib/prisma";
import { defaultLlmClient, type LlmClient } from "./llm";
import { buildResumePrompt, type ActivityLite } from "./prompt";

const MAX_ACTIVITIES = 150;

/**
 * Synthesize a user's most-recent Activity rows into a persisted Resume.
 * The LLM is injectable so callers/tests can supply a fake.
 */
export async function synthesizeResume(
  userId: string,
  llm: LlmClient = defaultLlmClient(),
): Promise<{ resumeId: string; itemCount: number }> {
  console.log(`[synthesis] start for user ${userId}`);

  const rows = await prisma.activity.findMany({
    where: { userId },
    orderBy: [{ occurredAt: "desc" }],
    take: MAX_ACTIVITIES,
  });
  console.log(`[synthesis] loaded ${rows.length} activities`);

  const activities: ActivityLite[] = rows.map((a) => ({
    type: a.type,
    title: a.title,
    body: a.body,
    url: a.url,
    metrics: a.metrics,
    occurredAt: a.occurredAt,
  }));

  // The candidate name lives on User, not Activity; the caller-facing display
  // name is wired elsewhere, so synthesis runs name-agnostic.
  const { system, user } = buildResumePrompt({ name: "", activities });
  const draft = await llm.draftResume(system, user);
  console.log(
    `[synthesis] draft: headline=${JSON.stringify(draft.headline)} items=${draft.items.length}`,
  );

  const resume = await prisma.resume.upsert({
    where: { userId },
    create: { userId, headline: draft.headline, summary: draft.summary },
    update: { headline: draft.headline, summary: draft.summary },
    select: { id: true },
  });

  // Rebuild items from scratch each run: drafts are regenerated, not merged.
  await prisma.resumeItem.deleteMany({ where: { resumeId: resume.id } });

  for (let i = 0; i < draft.items.length; i++) {
    const item = draft.items[i];
    const evidence =
      item.evidenceUrls.length > 0
        ? await prisma.activity.findMany({
            where: { userId, url: { in: item.evidenceUrls } },
            select: { id: true },
          })
        : [];

    await prisma.resumeItem.create({
      data: {
        resumeId: resume.id,
        kind: item.kind,
        content: item.content,
        order: i,
        status: "draft",
        evidence: { connect: evidence.map((e) => ({ id: e.id })) },
      },
    });
  }

  console.log(
    `[synthesis] persisted resume ${resume.id} with ${draft.items.length} items`,
  );
  return { resumeId: resume.id, itemCount: draft.items.length };
}

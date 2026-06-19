import { prisma } from "@/lib/prisma";
import { defaultLlmClient, type LlmClient } from "./llm";
import { buildResumePrompt, type ActivityLite } from "./prompt";
import { filterIgnored, ignoreSets } from "@/lib/repos";

const MAX_ACTIVITIES = 150;

/**
 * Synthesize a user's most-recent Activity rows into a persisted Resume.
 * The LLM is injectable so callers/tests can supply a fake.
 */
export async function synthesizeResume(
  userId: string,
  llm: LlmClient = defaultLlmClient(),
): Promise<{ resumeId: string; itemCount: number; added: number }> {
  console.log(`[synthesis] start for user ${userId}`);

  const rows = await prisma.activity.findMany({
    where: { userId },
    orderBy: [{ occurredAt: "desc" }],
    take: MAX_ACTIVITIES,
  });
  const ignored = await ignoreSets(userId);
  const kept = filterIgnored(rows, ignored);

  // Additive synthesis: never delete decided items, never reset user LaTeX.
  // Only synthesize from activity not already represented by an existing item,
  // so accepted/edited bullets and dismissed decisions survive every run.
  const existing = await prisma.resume.findUnique({
    where: { userId },
    select: {
      id: true,
      items: { select: { order: true, evidence: { select: { id: true } } } },
    },
  });
  const used = new Set<string>();
  let maxOrder = -1;
  for (const it of existing?.items ?? []) {
    if (it.order > maxOrder) maxOrder = it.order;
    for (const ev of it.evidence) used.add(ev.id);
  }
  const firstRun = !existing || existing.items.length === 0;
  const candidates = firstRun ? kept : kept.filter((a) => !used.has(a.id));
  console.log(
    `[synthesis] ${kept.length} kept, ${candidates.length} candidate(s)${firstRun ? " (first run)" : ""}`,
  );

  if (!firstRun && candidates.length === 0) {
    return { resumeId: existing!.id, itemCount: existing!.items.length, added: 0 };
  }

  const activities: ActivityLite[] = candidates.map((a) => ({
    type: a.type,
    title: a.title,
    body: a.body,
    url: a.url,
    metrics: a.metrics,
    occurredAt: a.occurredAt,
  }));

  const { system, user } = buildResumePrompt({ name: "", activities });
  const draft = await llm.draftResume(system, user);
  console.log(`[synthesis] draft: ${draft.items.length} items`);

  // Header fields (headline/summary/skills) are written once, on first run.
  // Incremental runs append only new suggestions — header, decided items, and
  // the user's edited `tex` are left untouched.
  const resume = firstRun
    ? await prisma.resume.upsert({
        where: { userId },
        create: {
          userId,
          headline: draft.headline,
          summary: draft.summary,
          skills: JSON.stringify(draft.skills),
        },
        update: {
          headline: draft.headline,
          summary: draft.summary,
          skills: JSON.stringify(draft.skills),
        },
        select: { id: true },
      })
    : { id: existing!.id };

  let order = maxOrder;
  for (const item of draft.items) {
    order += 1;
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
        kind: "work",
        content: item.content,
        project: item.project,
        projectMeta: item.projectMeta,
        projectUrl: item.projectUrl,
        order,
        status: "draft",
        evidence: { connect: evidence.map((e) => ({ id: e.id })) },
      },
    });
  }

  const itemCount = (firstRun ? 0 : existing!.items.length) + draft.items.length;
  console.log(`[synthesis] resume ${resume.id}: +${draft.items.length} (total ${itemCount})`);
  return { resumeId: resume.id, itemCount, added: draft.items.length };
}

import { prisma } from "@/lib/prisma";
import { defaultLlmClient, type LlmClient } from "./llm";

/**
 * Regenerate a single resume bullet via the LLM, grounded in its linked
 * evidence. Ownership is enforced by checking the item's resume.userId.
 */
export async function regenerateItem(
  itemId: string,
  userId: string,
  llm: LlmClient = defaultLlmClient(),
): Promise<{ content: string }> {
  const item = await prisma.resumeItem.findUnique({
    where: { id: itemId },
    include: { resume: { select: { userId: true } }, evidence: true },
  });
  if (!item || item.resume.userId !== userId) {
    throw new Error("Resume item not found");
  }

  const evidenceLines = item.evidence
    .map((e) => `- [${e.type}] ${e.title} <${e.url}>`)
    .join("\n");

  const system = [
    "You are an expert technical resume writer.",
    "Rewrite a single resume bullet to be more impactful and concise.",
    "Lead with the result, quantify only when the evidence supports it, and never invent facts beyond the evidence.",
    'Return JSON: { "content": string } — one line only.',
  ].join("\n");

  const user = [
    `Current bullet (project: ${item.project ?? "Open Source"}):`,
    item.content,
    "",
    evidenceLines ? `Evidence:\n${evidenceLines}` : "Evidence: (none)",
    "",
    "Rewrite it.",
  ].join("\n");

  const content = (await llm.rewriteBullet(system, user)).trim();

  await prisma.resumeItem.update({
    where: { id: itemId },
    data: { content, regenerated: true },
  });

  return { content };
}

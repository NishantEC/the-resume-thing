import { prisma } from "@/lib/prisma";

export type Kind = "experience" | "project" | "skill" | "highlight";

export type ResumeItemView = {
  id: string;
  kind: Kind;
  content: string;
  order: number;
  evidence: { url: string; title: string }[];
};

export type ResumeView = {
  headline: string | null;
  summary: string | null;
  items: ResumeItemView[];
};

const KINDS: readonly Kind[] = [
  "experience",
  "project",
  "skill",
  "highlight",
];

/** Coerce a free-form stored kind into the known vocabulary. */
function toKind(value: string): Kind {
  return (KINDS as readonly string[]).includes(value)
    ? (value as Kind)
    : "highlight";
}

export async function loadResume(userId: string): Promise<ResumeView | null> {
  const resume = await prisma.resume.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { evidence: { select: { url: true, title: true } } },
      },
    },
  });
  if (!resume) return null;

  return {
    headline: resume.headline,
    summary: resume.summary,
    items: resume.items.map((item) => ({
      id: item.id,
      kind: toKind(item.kind),
      content: item.content,
      order: item.order,
      evidence: item.evidence.map((e) => ({ url: e.url, title: e.title })),
    })),
  };
}

/**
 * Bucket items by kind, preserving input order within each bucket. All four
 * keys are always present (empty arrays allowed).
 */
export function groupItemsByKind(
  items: ResumeItemView[],
): Record<Kind, ResumeItemView[]> {
  const grouped: Record<Kind, ResumeItemView[]> = {
    experience: [],
    project: [],
    skill: [],
    highlight: [],
  };
  for (const item of items) {
    grouped[item.kind].push(item);
  }
  return grouped;
}

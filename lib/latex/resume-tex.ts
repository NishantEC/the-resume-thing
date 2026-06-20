import { prisma } from "@/lib/prisma";
import { loadResume } from "@/lib/resume/load";
import { renderResumeTex, type TemplateName } from "./template";

async function renderFromView(resumeId: string, name: string): Promise<string | null> {
  const view = await loadResume(resumeId);
  if (!view) return null;
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: { userId: true, template: true },
  });
  if (!resume) return null;
  const connection = await prisma.connection.findUnique({
    where: { userId_provider: { userId: resume.userId, provider: "github" } },
    select: { handle: true },
  });
  const contact = connection?.handle ? `github.com/${connection.handle}` : undefined;
  const template = (resume.template ?? "modern") as TemplateName;
  return renderResumeTex({ view, name, contact, template });
}

/** Stored manual LaTeX if present, otherwise freshly generated from the résumé. */
export async function effectiveResumeTex(resumeId: string, name: string): Promise<string | null> {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId }, select: { tex: true } });
  if (resume?.tex) return resume.tex;
  return renderFromView(resumeId, name);
}

/** Always regenerate from the structured résumé (ignores stored edits). */
export async function generatedResumeTex(resumeId: string, name: string): Promise<string | null> {
  return renderFromView(resumeId, name);
}

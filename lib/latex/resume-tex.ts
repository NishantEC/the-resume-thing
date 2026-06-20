import { prisma } from "@/lib/prisma";
import { loadResume } from "@/lib/resume/load";
import { renderResumeTex, type TemplateName } from "./template";

async function renderFromView(userId: string, name: string): Promise<string | null> {
  const view = await loadResume(userId);
  if (!view) return null;
  const [connection, resume] = await Promise.all([
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { handle: true },
    }),
    prisma.resume.findUnique({ where: { userId }, select: { template: true } }),
  ]);
  const contact = connection?.handle ? `github.com/${connection.handle}` : undefined;
  const template = (resume?.template ?? "modern") as TemplateName;
  return renderResumeTex({ view, name, contact, template });
}

/** Stored manual LaTeX if present, otherwise freshly generated from the resume. */
export async function effectiveResumeTex(userId: string, name: string): Promise<string | null> {
  const resume = await prisma.resume.findUnique({
    where: { userId },
    select: { tex: true },
  });
  if (resume?.tex) return resume.tex;
  return renderFromView(userId, name);
}

/** Always regenerate from the structured resume (ignores stored edits). */
export async function generatedResumeTex(userId: string, name: string): Promise<string | null> {
  return renderFromView(userId, name);
}

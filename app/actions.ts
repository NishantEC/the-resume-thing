"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncGithub, type SyncResult } from "@/lib/github/ingest";
import { synthesizeResume } from "@/lib/synthesis/synthesize";
import { regenerateItem, regenerateItemVariants } from "@/lib/synthesis/regenerate";
import { defaultLlmClient } from "@/lib/synthesis/llm";
import { tryCompileLatex } from "@/lib/latex/compile";
import { generatedResumeTex } from "@/lib/latex/resume-tex";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateWorkspace(): void {
  revalidatePath("/home");
  revalidatePath("/resume");
  revalidatePath("/review");
}

export async function syncGithubAction(): Promise<SyncResult> {
  const userId = await requireUserId();
  const result = await syncGithub(userId);
  revalidatePath("/home");
  revalidatePath("/settings");
  return result;
}

export async function generateResumeAction(): Promise<{
  resumeId: string;
  itemCount: number;
}> {
  const userId = await requireUserId();
  const result = await synthesizeResume(userId);
  revalidateWorkspace();
  return result;
}

export async function acceptItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.resumeItem.updateMany({
    where: { id, resume: { userId } },
    data: { status: "accepted" },
  });
  revalidateWorkspace();
}

export async function undoItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.resumeItem.updateMany({
    where: { id, resume: { userId } },
    data: { status: "draft" },
  });
  revalidateWorkspace();
}

export async function acceptAllAction(): Promise<void> {
  const userId = await requireUserId();
  await prisma.resumeItem.updateMany({
    where: { resume: { userId } },
    data: { status: "accepted" },
  });
  revalidateWorkspace();
}

export async function editItemAction(id: string, content: string): Promise<void> {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) throw new Error("Bullet cannot be empty");
  await prisma.resumeItem.updateMany({
    where: { id, resume: { userId } },
    data: { content: text },
  });
  revalidateWorkspace();
}

export async function regenerateItemAction(id: string): Promise<{ content: string }> {
  const userId = await requireUserId();
  const result = await regenerateItem(id, userId);
  revalidateWorkspace();
  return result;
}

export async function regenerateVariantsAction(id: string): Promise<{ variants: string[] }> {
  const userId = await requireUserId();
  return regenerateItemVariants(id, userId);
}

export async function reorderItemAction(id: string, direction: "up" | "down"): Promise<void> {
  const userId = await requireUserId();
  const item = await prisma.resumeItem.findFirst({
    where: { id, resume: { userId } },
    select: { id: true, order: true, project: true, resumeId: true },
  });
  if (!item) throw new Error("Resume item not found");

  const siblings = await prisma.resumeItem.findMany({
    where: { resumeId: item.resumeId, project: item.project, status: { not: "dismissed" } },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const index = siblings.findIndex((s) => s.id === item.id);
  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  const neighbor = siblings[neighborIndex];
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.resumeItem.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    prisma.resumeItem.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);

  revalidateWorkspace();
}

export async function dismissItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.resumeItem.updateMany({
    where: { id, resume: { userId } },
    data: { status: "dismissed" },
  });
  revalidateWorkspace();
}

export async function setTemplateAction(template: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.resume.updateMany({ where: { userId }, data: { template } });
  revalidateWorkspace();
}

export async function toggleIgnoreRepoAction(
  repo: string,
  ignored: boolean,
): Promise<void> {
  const userId = await requireUserId();
  if (ignored) {
    await prisma.ignoredRepo.upsert({
      where: { userId_repo: { userId, repo } },
      create: { userId, repo },
      update: {},
    });
  } else {
    await prisma.ignoredRepo.deleteMany({ where: { userId, repo } });
  }
  revalidatePath("/settings");
  revalidateWorkspace();
}

export async function toggleIgnoreOrgAction(
  org: string,
  ignored: boolean,
): Promise<void> {
  const userId = await requireUserId();
  if (ignored) {
    await prisma.ignoredOrg.upsert({
      where: { userId_org: { userId, org } },
      create: { userId, org },
      update: {},
    });
  } else {
    await prisma.ignoredOrg.deleteMany({ where: { userId, org } });
  }
  revalidatePath("/settings");
  revalidateWorkspace();
}

export async function saveLatexAction(
  tex: string,
): Promise<{ ok: boolean; log?: string }> {
  const userId = await requireUserId();
  const result = await tryCompileLatex(tex);
  if (!result.ok) return { ok: false, log: result.log };
  await prisma.resume.updateMany({ where: { userId }, data: { tex } });
  revalidatePath("/resume");
  return { ok: true };
}

export async function resetLatexAction(): Promise<{ ok: true; tex: string | null }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  await prisma.resume.updateMany({
    where: { userId: session.user.id },
    data: { tex: null },
  });
  revalidatePath("/resume");
  const tex = await generatedResumeTex(
    session.user.id,
    session.user.name || session.user.email,
  );
  return { ok: true, tex };
}

export async function aiEditLatexAction(
  instruction: string,
  currentTex: string,
): Promise<{ ok: boolean; tex: string; log?: string }> {
  const userId = await requireUserId();
  const newTex = await defaultLlmClient().editLatex(currentTex, instruction);
  const result = await tryCompileLatex(newTex);
  if (!result.ok) return { ok: false, tex: newTex, log: result.log };
  await prisma.resume.updateMany({ where: { userId }, data: { tex: newTex } });
  revalidatePath("/resume");
  return { ok: true, tex: newTex };
}

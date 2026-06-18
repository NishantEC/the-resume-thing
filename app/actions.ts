"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { syncGithub, type SyncResult } from "@/lib/github/ingest";
import { synthesizeResume } from "@/lib/synthesis/synthesize";

export async function syncGithubAction(): Promise<SyncResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const result = await syncGithub(session.user.id);
  revalidatePath("/dashboard");
  return result;
}

export async function generateResumeAction(): Promise<{
  resumeId: string;
  itemCount: number;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const result = await synthesizeResume(session.user.id);
  revalidatePath("/dashboard");
  revalidatePath("/resume");
  return result;
}

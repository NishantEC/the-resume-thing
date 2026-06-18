"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { syncGithub, type SyncResult } from "@/lib/github/ingest";

export async function syncGithubAction(): Promise<SyncResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const result = await syncGithub(session.user.id);
  revalidatePath("/dashboard");
  return result;
}

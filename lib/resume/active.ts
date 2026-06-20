import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_RESUME_COOKIE = "active_resume";

/**
 * The user's currently-selected résumé id: the cookie value if it points at a
 * résumé they own, else their most recently updated résumé, else null (none yet).
 */
export async function activeResumeId(userId: string): Promise<string | null> {
  const wanted = (await cookies()).get(ACTIVE_RESUME_COOKIE)?.value;
  if (wanted) {
    const owned = await prisma.resume.findFirst({ where: { id: wanted, userId }, select: { id: true } });
    if (owned) return owned.id;
  }
  const recent = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return recent?.id ?? null;
}

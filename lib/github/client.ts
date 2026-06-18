import { Octokit } from "@octokit/rest";
import { prisma } from "@/lib/prisma";

/** The GitHub access token Better Auth stored on the user's linked account. */
export async function getGithubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

export async function githubForUser(userId: string): Promise<Octokit> {
  const token = await getGithubToken(userId);
  if (!token) {
    throw new Error("No GitHub access token for this user — connect GitHub first.");
  }
  return new Octokit({ auth: token });
}

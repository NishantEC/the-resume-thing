import { prisma } from "@/lib/prisma";
import { githubForUser } from "./client";
import {
  normalizeIssueOrPr,
  normalizeOrg,
  normalizeRepo,
  type NormalizedActivity,
} from "./normalize";

export interface SyncResult {
  imported: number;
  byType: Record<string, number>;
}

/**
 * Pull the authenticated user's GitHub activity and upsert it into Activity.
 * Idempotent: re-running refreshes existing rows (keyed by provider+type+externalId).
 */
export async function syncGithub(userId: string): Promise<SyncResult> {
  const gh = await githubForUser(userId);
  const { data: me } = await gh.users.getAuthenticated();

  const activities: NormalizedActivity[] = [];

  const repos = await gh.paginate(gh.repos.listForAuthenticatedUser, {
    per_page: 100,
    affiliation: "owner,collaborator,organization_member",
    sort: "pushed",
  });
  for (const repo of repos) activities.push(normalizeRepo(repo));

  const prs = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:pr`,
    per_page: 100,
  });
  for (const pr of prs) activities.push(normalizeIssueOrPr(pr, "pull_request"));

  const issues = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:issue`,
    per_page: 100,
  });
  for (const issue of issues) activities.push(normalizeIssueOrPr(issue, "issue"));

  const orgs = await gh.paginate(gh.orgs.listForAuthenticatedUser, {
    per_page: 100,
  });
  for (const org of orgs) activities.push(normalizeOrg(org));

  const byType: Record<string, number> = {};
  for (const a of activities) {
    await prisma.activity.upsert({
      where: {
        provider_type_externalId: {
          provider: a.provider,
          type: a.type,
          externalId: a.externalId,
        },
      },
      create: { ...a, userId },
      update: {
        title: a.title,
        body: a.body,
        url: a.url,
        metrics: a.metrics,
        occurredAt: a.occurredAt,
        raw: a.raw,
      },
    });
    byType[a.type] = (byType[a.type] ?? 0) + 1;
  }

  await prisma.connection.upsert({
    where: { userId_provider: { userId, provider: "github" } },
    create: {
      userId,
      provider: "github",
      externalId: String(me.id),
      lastSyncAt: new Date(),
    },
    update: { lastSyncAt: new Date(), externalId: String(me.id) },
  });

  return { imported: activities.length, byType };
}

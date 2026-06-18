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
  console.log(`[sync] start for ${me.login} (user ${userId})`);

  const activities: NormalizedActivity[] = [];

  const repos = await gh.paginate(gh.repos.listForAuthenticatedUser, {
    per_page: 100,
    affiliation: "owner,collaborator,organization_member",
    sort: "pushed",
  });
  for (const repo of repos) activities.push(normalizeRepo(repo));
  console.log(`[sync] ${repos.length} repos`);

  const prs = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:pr`,
    per_page: 100,
  });
  for (const pr of prs) activities.push(normalizeIssueOrPr(pr, "pull_request"));
  console.log(`[sync] ${prs.length} pull requests`);

  const issues = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:issue`,
    per_page: 100,
  });
  for (const issue of issues) activities.push(normalizeIssueOrPr(issue, "issue"));
  console.log(`[sync] ${issues.length} issues`);

  const orgs = await gh.paginate(gh.orgs.listForAuthenticatedUser, {
    per_page: 100,
  });
  for (const org of orgs) activities.push(normalizeOrg(org));
  console.log(`[sync] ${orgs.length} orgs; upserting ${activities.length} activities`);

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
  console.log(`[sync] done: imported ${activities.length}`);

  return { imported: activities.length, byType };
}

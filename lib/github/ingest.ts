import { prisma } from "@/lib/prisma";
import { githubForUser } from "./client";
import {
  normalizeCommit,
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
export async function syncGithub(userId: string, since?: Date): Promise<SyncResult> {
  const gh = await githubForUser(userId);
  const { data: me } = await gh.users.getAuthenticated();
  console.log(`[sync] start for ${me.login} (user ${userId})`);

  const activities: NormalizedActivity[] = [];
  // Delta sync: when called by the continuous worker we only want work touched
  // since the last successful sync. GitHub search accepts day-granular qualifiers.
  const dq = since ? ` updated:>=${since.toISOString().slice(0, 10)}` : "";
  const cq = since ? ` author-date:>=${since.toISOString().slice(0, 10)}` : "";

  const repos = await gh.paginate(gh.repos.listForAuthenticatedUser, {
    per_page: 100,
    affiliation: "owner",
    sort: "pushed",
  });
  for (const repo of repos) activities.push(normalizeRepo(repo));
  console.log(`[sync] ${repos.length} owned repos`);

  const prs = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:pr${dq}`,
    per_page: 100,
  });
  for (const pr of prs) activities.push(normalizeIssueOrPr(pr, "pull_request"));
  console.log(`[sync] ${prs.length} pull requests`);

  const issues = await gh.paginate(gh.search.issuesAndPullRequests, {
    q: `author:${me.login} type:issue${dq}`,
    per_page: 100,
  });
  for (const issue of issues) activities.push(normalizeIssueOrPr(issue, "issue"));
  console.log(`[sync] ${issues.length} issues`);

  const commits = await gh.search.commits({
    q: `author:${me.login}${cq}`,
    sort: "author-date",
    order: "desc",
    per_page: 100,
  });
  for (const c of commits.data.items) activities.push(normalizeCommit(c));
  console.log(`[sync] ${commits.data.items.length} commits`);

  const orgs = await gh.paginate(gh.orgs.listForAuthenticatedUser, {
    per_page: 100,
  });
  for (const org of orgs) activities.push(normalizeOrg(org));
  console.log(`[sync] ${orgs.length} orgs; upserting ${activities.length} activities`);
  // Best-effort: enrich PRs with diff stats (additions/deletions) for evidence.
  const prActivities = activities.filter((a) => a.type === "pull_request");
  const CONCURRENCY = 8;
  for (let i = 0; i < prActivities.length; i += CONCURRENCY) {
    await Promise.all(
      prActivities.slice(i, i + CONCURRENCY).map(async (a) => {
        const m = a.url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
        if (!m) return;
        try {
          const { data } = await gh.pulls.get({
            owner: m[1],
            repo: m[2],
            pull_number: Number(m[3]),
          });
          const metrics = a.metrics ? JSON.parse(a.metrics) : {};
          metrics.additions = data.additions;
          metrics.deletions = data.deletions;
          a.metrics = JSON.stringify(metrics);
        } catch {
          // Skip diff stats for this PR; not fatal.
        }
      }),
    );
  }
  console.log(`[sync] enriched ${prActivities.length} PRs with diff stats`);

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
      handle: me.login,
      lastSyncAt: new Date(),
    },
    update: { lastSyncAt: new Date(), externalId: String(me.id), handle: me.login },
  });
  console.log(`[sync] done: imported ${activities.length}`);

  return { imported: activities.length, byType };
}

import type { SyncResult, ActivityRow } from "@/lib/sources/types";
import { upsertActivities, recordConnection } from "@/lib/sources/upsert";
import { getLinearToken, linearGraphQL } from "./client";
import {
  normalizeLinearIssue,
  normalizeLinearProject,
  type LinearIssueNode,
  type LinearProjectNode,
} from "./normalize";

const PAGE_SIZE = 50;

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface Connection<T> {
  nodes: T[];
  pageInfo: PageInfo;
}

interface ViewerIdentity {
  id: string;
  name: string;
}

const ISSUE_FIELDS = `
  id
  identifier
  title
  description
  url
  priority
  estimate
  createdAt
  updatedAt
  completedAt
  state { name type }
  project { name url }
  team { name key }
`;

const VIEWER_QUERY = `query Viewer { viewer { id name } }`;

interface ViewerResponse {
  viewer: ViewerIdentity;
}

const ASSIGNED_ISSUES_QUERY = `
  query AssignedIssues($filter: IssueFilter, $first: Int!, $after: String) {
    viewer {
      assignedIssues(filter: $filter, first: $first, after: $after, orderBy: updatedAt) {
        nodes { ${ISSUE_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const CREATED_ISSUES_QUERY = `
  query CreatedIssues($filter: IssueFilter, $first: Int!, $after: String) {
    viewer {
      createdIssues(filter: $filter, first: $first, after: $after, orderBy: updatedAt) {
        nodes { ${ISSUE_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const PROJECTS_QUERY = `
  query Projects($pf: ProjectFilter, $first: Int!, $after: String) {
    projects(filter: $pf, first: $first, after: $after, orderBy: updatedAt) {
      nodes { id name url updatedAt status { name type } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

interface AssignedIssuesResponse {
  viewer: { assignedIssues: Connection<LinearIssueNode> };
}

interface CreatedIssuesResponse {
  viewer: { createdIssues: Connection<LinearIssueNode> };
}

interface ProjectsResponse {
  projects: Connection<LinearProjectNode>;
}

/**
 * Pull the authenticated user's Linear work and upsert it into Activity.
 * Delta-aware (empty filter for a full sync); idempotent via upsertActivities.
 */
export async function syncLinear(userId: string, since?: Date): Promise<SyncResult> {
  const token = await getLinearToken(userId);
  if (!token) {
    return { imported: 0, byType: {} };
  }

  const issueFilter = since ? { updatedAt: { gte: since.toISOString() } } : {};
  const projectFilter = since ? { updatedAt: { gte: since.toISOString() } } : {};

  const viewerData = await linearGraphQL<ViewerResponse>(token, VIEWER_QUERY);
  const viewer = viewerData.viewer;
  console.log(`[linear] start for ${viewer.name} (user ${userId})`);

  // Dedupe across assigned + created issues by node id.
  const issuesById = new Map<string, LinearIssueNode>();

  let assignedCount = 0;
  let after: string | null = null;
  for (;;) {
    const data: AssignedIssuesResponse = await linearGraphQL<AssignedIssuesResponse>(
      token,
      ASSIGNED_ISSUES_QUERY,
      { filter: issueFilter, first: PAGE_SIZE, after },
    );
    const conn = data.viewer.assignedIssues;
    for (const node of conn.nodes) issuesById.set(node.id, node);
    assignedCount += conn.nodes.length;
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  console.log(`[linear] ${assignedCount} assigned issues`);

  let createdCount = 0;
  after = null;
  for (;;) {
    const data: CreatedIssuesResponse = await linearGraphQL<CreatedIssuesResponse>(
      token,
      CREATED_ISSUES_QUERY,
      { filter: issueFilter, first: PAGE_SIZE, after },
    );
    const conn = data.viewer.createdIssues;
    for (const node of conn.nodes) issuesById.set(node.id, node);
    createdCount += conn.nodes.length;
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  console.log(`[linear] ${createdCount} created issues`);

  const projects: LinearProjectNode[] = [];
  after = null;
  for (;;) {
    const data: ProjectsResponse = await linearGraphQL<ProjectsResponse>(
      token,
      PROJECTS_QUERY,
      { pf: projectFilter, first: PAGE_SIZE, after },
    );
    const conn = data.projects;
    for (const node of conn.nodes) projects.push(node);
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  console.log(`[linear] ${projects.length} projects`);

  const issueRows: ActivityRow[] = [];
  for (const node of issuesById.values()) issueRows.push(normalizeLinearIssue(node));
  const projectRows: ActivityRow[] = projects.map(normalizeLinearProject);

  const rows: ActivityRow[] = [...issueRows, ...projectRows];
  console.log(`[linear] upserting ${rows.length} activities`);

  const byType = await upsertActivities(userId, rows);
  await recordConnection(userId, "linear", viewer.id, viewer.name);
  console.log(`[linear] done: imported ${rows.length}`);

  return { imported: rows.length, byType };
}

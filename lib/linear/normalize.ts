// Pure mappers: Linear GraphQL payloads -> normalized Activity rows.
// Each carries `url` (provenance) and a stable `externalId` for idempotent upserts.

import type { ActivityRow } from "@/lib/sources/types";

interface LinearWorkflowState {
  name: string;
  type: string;
}

interface LinearProjectRef {
  name: string;
  url: string;
}

interface LinearTeamRef {
  name: string;
  key: string;
}

/** A Linear issue node as requested from the GraphQL API. */
export interface LinearIssueNode {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  url: string;
  priority?: number | null;
  estimate?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  state?: LinearWorkflowState | null;
  project?: LinearProjectRef | null;
  team?: LinearTeamRef | null;
}

/** A Linear project node as requested from the GraphQL API. */
export interface LinearProjectNode {
  id: string;
  name: string;
  url: string;
  updatedAt?: string | null;
  status?: LinearWorkflowState | null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeLinearIssue(node: LinearIssueNode): ActivityRow {
  return {
    provider: "linear",
    type: "issue",
    externalId: node.id,
    title: `${node.identifier} ${node.title}`,
    body: node.description ?? null,
    url: node.url,
    metrics: JSON.stringify({
      state: node.state?.name,
      stateType: node.state?.type,
      priority: node.priority,
      estimate: node.estimate ?? null,
      project: node.project?.name ?? null,
      team: node.team?.key ?? null,
      completedAt: node.completedAt ?? null,
    }),
    occurredAt: toDate(node.completedAt ?? node.updatedAt ?? node.createdAt),
    raw: JSON.stringify(node),
  };
}

export function normalizeLinearProject(node: LinearProjectNode): ActivityRow {
  return {
    provider: "linear",
    type: "project",
    externalId: node.id,
    title: node.name,
    body: null,
    url: node.url,
    metrics: JSON.stringify({
      status: node.status?.name ?? null,
      statusType: node.status?.type ?? null,
    }),
    occurredAt: toDate(node.updatedAt),
    raw: JSON.stringify(node),
  };
}

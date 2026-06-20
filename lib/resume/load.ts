import { prisma } from "@/lib/prisma";

export type EvidenceChip = {
  url: string;
  kind: "PR" | "ISSUE" | "GITHUB";
  tagBg: string;
  tagColor: string;
  repoRef: string;
  add: string;
  del: string;
  hasStat: boolean;
  date: string;
  sourceLabel: string;
};

export type ItemView = {
  id: string;
  content: string;
  accepted: boolean;
  regenerated: boolean;
  evidence: EvidenceChip[];
};

export type ProjectGroup = {
  project: string;
  meta: string;
  repoUrl: string;
  items: ItemView[];
};

export type Skill = { label: string; list: string };

export type ResumeView = {
  headline: string | null;
  summary: string | null;
  skills: Skill[];
  groups: ProjectGroup[];
  acceptedCount: number;
  totalItems: number;
  pct: number;
};

type EvidenceInput = {
  type: string;
  url: string;
  metrics: string | null;
  occurredAt: Date | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function tagFor(type: string): { kind: EvidenceChip["kind"]; bg: string; color: string } {
  if (type === "pull_request") return { kind: "PR", bg: "rgba(59,130,246,0.10)", color: "#1d4ed8" };
  if (type === "issue") return { kind: "ISSUE", bg: "rgba(245,158,11,0.13)", color: "#b45309" };
  return { kind: "GITHUB", bg: "rgba(0,0,0,0.05)", color: "#525252" };
}

function monthYear(date: Date | null): string {
  if (!date) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function thousands(n: number): string {
  return n.toLocaleString("en-US");
}

function repoFromUrl(url: string): string {
  const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (m) return `${m[1]}/${m[2]}`;
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function refFromUrl(url: string): string | null {
  const m = url.match(/\/(?:pull|issues)\/(\d+)/);
  return m ? m[1] : null;
}

export function toEvidenceChip(a: EvidenceInput): EvidenceChip {
  const tag = tagFor(a.type);
  let metrics: Record<string, unknown> = {};
  try {
    metrics = a.metrics ? (JSON.parse(a.metrics) as Record<string, unknown>) : {};
  } catch {
    metrics = {};
  }
  const repo = typeof metrics.repo === "string" ? metrics.repo : repoFromUrl(a.url);
  const ref = refFromUrl(a.url);
  const additions = typeof metrics.additions === "number" ? metrics.additions : null;
  const deletions = typeof metrics.deletions === "number" ? metrics.deletions : null;
  const hasStat = additions !== null && deletions !== null;
  return {
    url: a.url,
    kind: tag.kind,
    tagBg: tag.bg,
    tagColor: tag.color,
    repoRef: ref ? `${repo}#${ref}` : repo,
    add: hasStat ? `+${thousands(additions)}` : "",
    del: hasStat ? `\u2212${thousands(deletions)}` : "",
    hasStat,
    date: monthYear(a.occurredAt),
    sourceLabel: ref ? `source ${ref}` : "source",
  };
}

export function parseSkills(raw: string | null): Skill[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (s): s is Skill =>
          typeof s === "object" &&
          s !== null &&
          typeof (s as Skill).label === "string" &&
          typeof (s as Skill).list === "string",
      )
      .map((s) => ({ label: s.label, list: s.list }));
  } catch {
    return [];
  }
}

export async function loadResume(resumeId: string): Promise<ResumeView | null> {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      items: { where: { status: { not: "dismissed" } }, orderBy: { order: "asc" }, include: { evidence: true } },
    },
  });
  if (!resume) return null;

  const groupsByKey = new Map<string, ProjectGroup>();
  for (const item of resume.items) {
    const project = item.project ?? "Open Source";
    let group = groupsByKey.get(project);
    if (!group) {
      group = {
        project,
        meta: item.projectMeta ?? "",
        repoUrl: item.projectUrl ?? "",
        items: [],
      };
      groupsByKey.set(project, group);
    }
    group.items.push({
      id: item.id,
      content: item.content,
      accepted: item.status === "accepted",
      regenerated: item.regenerated,
      evidence: item.evidence.map(toEvidenceChip),
    });
  }

  const totalItems = resume.items.length;
  const acceptedCount = resume.items.filter((i) => i.status === "accepted").length;

  return {
    headline: resume.headline,
    summary: resume.summary,
    skills: parseSkills(resume.skills),
    groups: [...groupsByKey.values()],
    acceptedCount,
    totalItems,
    pct: totalItems === 0 ? 0 : Math.round((acceptedCount / totalItems) * 100),
  };
}

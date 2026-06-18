// Pure prompt construction for resume synthesis. No imports beyond types so
// this stays trivially unit-testable (no network, no DB, no SDK).

export type ActivityLite = {
  type: string;
  title: string;
  body: string | null;
  url: string;
  metrics: string | null;
  occurredAt: Date | null;
};

const BODY_MAX = 280;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  // Reserve one char for the ellipsis so the result never exceeds `max`.
  return `${trimmed.slice(0, max - 1).trimEnd()}\u2026`;
}

/**
 * Serialize a single activity into a compact, model-friendly line. We expose
 * only the fields that carry signal (type, title, url, year, truncated body)
 * to keep the prompt cheap and focused.
 */
function serializeActivity(a: ActivityLite): string {
  const parts = [`- [${a.type}] ${a.title.trim()}`];
  const y = a.occurredAt ? String(a.occurredAt.getUTCFullYear()) : "";
  if (y) parts.push(`(${y})`);
  parts.push(`<${a.url}>`);
  let line = parts.join(" ");
  if (a.body && a.body.trim()) {
    line += `\n  ${truncate(a.body, BODY_MAX)}`;
  }
  return line;
}

/**
 * Build the system + user messages that ask the model to synthesize a resume.
 * The system message pins the output contract (strict ResumeDraft JSON); the
 * user message carries the curated activity log.
 */
export function buildResumePrompt(input: {
  name: string;
  activities: ActivityLite[];
}): { system: string; user: string } {
  const system = [
    "You are an expert technical resume writer.",
    "You transform a developer's raw work activity (GitHub repos, pull requests, issues, org memberships) into a concise, high-impact resume.",
    "Curate aggressively: deduplicate overlapping work, group related activity, and rewrite each entry as a results-oriented accomplishment bullet (lead with impact, quantify where the evidence supports it). Never invent facts not grounded in the provided activity.",
    "Cite the source of every item by listing the relevant activity url(s) in its evidenceUrls array.",
    "",
    "Return STRICT JSON ONLY. Output a single JSON object and nothing else \u2014 no markdown fences, no prose, no commentary.",
    "The JSON must match this ResumeDraft shape exactly:",
    '{ "headline": string, "summary": string, "items": [ { "kind": string, "content": string, "evidenceUrls": string[] } ] }',
    'Each item "kind" MUST be one of exactly these four values: "experience" | "project" | "skill" | "highlight".',
    '"content" is the accomplishment bullet text. "evidenceUrls" lists the activity url(s) supporting that item.',
    '"headline" is a one-line professional title; "summary" is a short professional summary paragraph.',
  ].join("\n");

  const name = input.name.trim();
  const header = name
    ? `Candidate: ${name}`
    : "Candidate name: (unknown \u2014 omit personal name from the resume)";

  const body =
    input.activities.length > 0
      ? input.activities.map(serializeActivity).join("\n")
      : "(no activity available)";

  const user = [
    header,
    "",
    "Activity log:",
    body,
    "",
    "Produce the ResumeDraft JSON now.",
  ].join("\n");

  return { system, user };
}

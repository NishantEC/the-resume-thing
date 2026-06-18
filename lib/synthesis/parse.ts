// Pure parsing/validation of the model's JSON response into a ResumeDraft.
// Defensive: models wrap JSON in fences or prose, so we locate the outermost
// object before parsing, then coerce every field to a known shape.

export type ResumeKind = "experience" | "project" | "skill" | "highlight";

export type ResumeDraftItem = {
  kind: ResumeKind;
  content: string;
  evidenceUrls: string[];
};

export type ResumeDraft = {
  headline: string;
  summary: string;
  items: ResumeDraftItem[];
};

const KINDS: readonly ResumeKind[] = [
  "experience",
  "project",
  "skill",
  "highlight",
];

/**
 * Extract the outermost balanced `{...}` object from arbitrary text, ignoring
 * braces that appear inside JSON string literals. Returns null when no complete
 * object is present.
 */
function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function coerceItem(value: unknown): ResumeDraftItem | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;

  const content =
    typeof obj.content === "string" ? obj.content.trim() : String(obj.content ?? "").trim();
  if (content === "") return null;

  const kind: ResumeKind = KINDS.includes(obj.kind as ResumeKind)
    ? (obj.kind as ResumeKind)
    : "highlight";

  const evidenceUrls = Array.isArray(obj.evidenceUrls)
    ? obj.evidenceUrls.filter((u): u is string => typeof u === "string")
    : [];

  return { kind, content, evidenceUrls };
}

/**
 * Parse a raw model response into a validated ResumeDraft. Throws when no JSON
 * object can be located or JSON.parse fails; otherwise always returns a
 * well-formed draft (invalid items are dropped, fields defaulted).
 */
export function parseResumeDraft(raw: string): ResumeDraft {
  const json = extractJsonObject(raw);
  if (json === null) {
    throw new Error("parseResumeDraft: no JSON object found in model response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new Error(`parseResumeDraft: failed to JSON.parse model response: ${String(cause)}`);
  }

  const obj = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<
    string,
    unknown
  >;

  const headline = typeof obj.headline === "string" ? obj.headline : "";
  const summary = typeof obj.summary === "string" ? obj.summary : "";

  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  const items: ResumeDraftItem[] = [];
  for (const entry of rawItems) {
    const item = coerceItem(entry);
    if (item) items.push(item);
  }

  return { headline, summary, items };
}

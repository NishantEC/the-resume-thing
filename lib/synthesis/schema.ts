import { jsonSchema } from "ai";

export interface ResumeDraftSkill {
  label: string;
  list: string;
}

export interface ResumeDraftItem {
  project: string;
  projectMeta: string;
  projectUrl: string;
  content: string;
  evidenceUrls: string[];
}

export interface ResumeDraft {
  headline: string;
  summary: string;
  skills: ResumeDraftSkill[];
  items: ResumeDraftItem[];
}

// JSON Schema for the model's structured output. Kept to keywords Gemini's
// structured-output mode supports (no additionalProperties), so the same schema
// works across providers via generateObject().
export const resumeDraftSchema = jsonSchema<ResumeDraft>({
  type: "object",
  properties: {
    headline: {
      type: "string",
      description: "A short professional headline, e.g. 'Platform Engineer · Developer Tooling'.",
    },
    summary: {
      type: "string",
      description: "A 2-3 sentence professional summary.",
    },
    skills: {
      type: "array",
      description:
        "3-4 labeled skill groups inferred from the activity, e.g. { label: 'Languages', list: 'Go, TypeScript' }.",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "Group name, e.g. 'Languages', 'Infrastructure', 'Focus'." },
          list: { type: "string", description: "Comma-separated skills." },
        },
        required: ["label", "list"],
      },
    },
    items: {
      type: "array",
      description: "Accomplishment bullets, each grouped under a project.",
      items: {
        type: "object",
        properties: {
          project: {
            type: "string",
            description: "Project/repo display name; use 'Open Source' for cross-repo or profile-level work.",
          },
          projectMeta: {
            type: "string",
            description: "Short descriptor: role · stars · languages, e.g. 'Maintainer · 4.2k★ · TypeScript, Go'.",
          },
          projectUrl: { type: "string", description: "Repository or profile URL." },
          content: { type: "string", description: "One impactful, resume-ready line." },
          evidenceUrls: {
            type: "array",
            description: "Source activity URLs backing this item.",
            items: { type: "string" },
          },
        },
        required: ["project", "projectMeta", "projectUrl", "content", "evidenceUrls"],
      },
    },
  },
  required: ["headline", "summary", "skills", "items"],
});

export const bulletSchema = jsonSchema<{ content: string }>({
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "The rewritten resume bullet — one impactful, evidence-grounded line.",
    },
  },
  required: ["content"],
});

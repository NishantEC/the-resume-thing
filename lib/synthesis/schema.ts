import { jsonSchema } from "ai";

export type ResumeKind = "experience" | "project" | "skill" | "highlight";

export interface ResumeDraftItem {
  kind: ResumeKind;
  content: string;
  evidenceUrls: string[];
}

export interface ResumeDraft {
  headline: string;
  summary: string;
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
      description: "A short professional headline, e.g. 'Senior Backend Engineer'.",
    },
    summary: {
      type: "string",
      description: "A 2-3 sentence professional summary.",
    },
    items: {
      type: "array",
      description: "Accomplishment bullets, curated and deduped from the activity.",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["experience", "project", "skill", "highlight"],
          },
          content: {
            type: "string",
            description: "One impactful, resume-ready line.",
          },
          evidenceUrls: {
            type: "array",
            description: "Source activity URLs backing this item.",
            items: { type: "string" },
          },
        },
        required: ["kind", "content", "evidenceUrls"],
      },
    },
  },
  required: ["headline", "summary", "items"],
});

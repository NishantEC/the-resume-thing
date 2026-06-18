import { describe, it, expect } from "vitest";
import { buildResumePrompt, type ActivityLite } from "./prompt";

const sample: ActivityLite = {
  type: "pull_request",
  title: "Add retry logic to ingest pipeline",
  body: "Implements exponential backoff for the GitHub sync job.",
  url: "https://github.com/acme/repo/pull/42",
  metrics: null,
  occurredAt: new Date("2024-03-15T00:00:00Z"),
};

describe("buildResumePrompt", () => {
  it("system message pins the project-grouped ResumeDraft contract", () => {
    const { system } = buildResumePrompt({ name: "Ada", activities: [sample] });
    expect(system).toContain("ResumeDraft");
    expect(system).toContain("projectMeta");
    expect(system).toContain("skills");
  });

  it("user message contains the activity title and url", () => {
    const { user } = buildResumePrompt({ name: "Ada", activities: [sample] });
    expect(user).toContain(sample.title);
    expect(user).toContain(sample.url);
  });

  it("includes the occurredAt year", () => {
    const { user } = buildResumePrompt({ name: "Ada", activities: [sample] });
    expect(user).toContain("2024");
  });

  it("truncates long bodies to ~280 chars with an ellipsis", () => {
    const longBody = "x".repeat(500);
    const { user } = buildResumePrompt({
      name: "",
      activities: [{ ...sample, body: longBody }],
    });
    expect(user).toContain("\u2026");
    expect(user).not.toContain("x".repeat(300));
    // The truncated run of x's must not exceed the 280-char budget.
    const run = user.match(/x+/)?.[0] ?? "";
    expect(run.length).toBeLessThanOrEqual(280);
  });

  it("omits the year segment when occurredAt is null", () => {
    const { user } = buildResumePrompt({
      name: "",
      activities: [{ ...sample, occurredAt: null }],
    });
    expect(user).toContain(sample.url);
    expect(user).not.toContain("(2024)");
  });

  it("surfaces repo, language, stars and diff metrics in the activity line", () => {
    const { user } = buildResumePrompt({
      name: "",
      activities: [
        {
          ...sample,
          metrics: JSON.stringify({
            repo: "acme/repo",
            language: "Go",
            stars: 42,
            additions: 120,
            deletions: 8,
          }),
        },
      ],
    });
    expect(user).toContain("repo=acme/repo");
    expect(user).toContain("lang=Go");
    expect(user).toContain("stars=42");
    expect(user).toContain("diff=+120/-8");
  });

  it("handles an empty activity list without throwing", () => {
    const { user } = buildResumePrompt({ name: "", activities: [] });
    expect(user).toContain("no activity");
  });
});

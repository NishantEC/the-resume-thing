import { describe, expect, it } from "vitest";
import { renderResumePdf } from "@/lib/pdf/render";
import type { ResumeView } from "@/lib/resume/load";

const view: ResumeView = {
  headline: "Senior Software Engineer",
  summary: "Builds reliable developer tools.",
  items: [
    {
      id: "1",
      kind: "project",
      content: "Shipped the widget factory used by 12 teams.",
      order: 0,
      evidence: [{ url: "https://github.com/acme/widgets", title: "acme/widgets" }],
    },
    { id: "2", kind: "skill", content: "TypeScript, Next.js, Postgres", order: 1, evidence: [] },
    { id: "3", kind: "highlight", content: "Cut p95 latency 40%.", order: 2, evidence: [] },
  ],
};

describe("renderResumePdf", () => {
  it("renders a non-trivial, well-formed PDF", async () => {
    const pdf = await renderResumePdf(view, "Ada Lovelace");
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30_000);

  it("renders even when the resume is empty", async () => {
    const pdf = await renderResumePdf(
      { headline: null, summary: null, items: [] },
      "Nobody",
    );
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 30_000);
});

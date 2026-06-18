import { describe, expect, it } from "vitest";
import { renderResumePdf } from "@/lib/pdf/render";
import type { ResumeView } from "@/lib/resume/load";

const view: ResumeView = {
  headline: "Platform Engineer · Developer Tooling",
  summary: "Builds reliable developer tools.",
  skills: [
    { label: "Languages", list: "Go, TypeScript, Rust" },
    { label: "Focus", list: "Observability, API design" },
  ],
  groups: [
    {
      project: "postcard",
      meta: "Maintainer · 4.2k★ · TypeScript, Go",
      repoUrl: "https://github.com/okafor/postcard",
      items: [
        {
          id: "1",
          content: "Shipped a streaming edge renderer, cutting p99 latency 62%.",
          accepted: true,
          regenerated: false,
          evidence: [
            {
              url: "https://github.com/okafor/postcard/pull/412",
              kind: "PR",
              tagBg: "",
              tagColor: "",
              repoRef: "okafor/postcard#412",
              add: "+1,240",
              del: "\u2212880",
              hasStat: true,
              date: "May 2026",
              sourceLabel: "source 412",
            },
          ],
        },
      ],
    },
  ],
  acceptedCount: 1,
  totalItems: 1,
  pct: 100,
};

describe("renderResumePdf", () => {
  it("renders a non-trivial, well-formed PDF", async () => {
    const pdf = await renderResumePdf(view, "Ada Lovelace", "github.com/ada");
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30_000);

  it("renders even when the resume is empty", async () => {
    const pdf = await renderResumePdf(
      { headline: null, summary: null, skills: [], groups: [], acceptedCount: 0, totalItems: 0, pct: 0 },
      "Nobody",
    );
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 30_000);
});

import { describe, expect, it } from "vitest";
import { renderResumeTex } from "./template";
import { compileLatex } from "./compile";
import type { ResumeView } from "@/lib/resume/load";

const view: ResumeView = {
  headline: "Platform Engineer · Developer Tooling",
  summary: "Ships reliable Go & TypeScript services — 100% in the open.",
  skills: [
    { label: "Languages", list: "Go, TypeScript, Rust" },
    { label: "Focus", list: "Observability, API design, CI/CD" },
  ],
  groups: [
    {
      project: "postcard",
      meta: "Maintainer · 4.2k★ · TypeScript, Go",
      repoUrl: "https://github.com/okafor/postcard",
      items: [
        {
          id: "1",
          content: "Cut p99 render latency 62% with a streaming edge renderer.",
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

describe("latex compile (run-once)", () => {
  it("compiles modern + classic to valid PDFs via tectonic", async () => {
    for (const template of ["modern", "classic"] as const) {
      const tex = renderResumeTex({ view, name: "Ada & Lovelace", contact: "github.com/ada", template });
      const pdf = await compileLatex(tex);
      expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(1000);
    }
  }, 180_000);
});

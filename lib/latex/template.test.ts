import { describe, expect, it } from "vitest";
import { renderResumeTex } from "./template";
import type { ResumeView } from "@/lib/resume/load";

const view: ResumeView = {
  headline: "Platform Engineer",
  summary: "Builds tools & systems.",
  skills: [{ label: "Languages", list: "Go, TypeScript" }],
  groups: [
    {
      project: "postcard",
      meta: "Maintainer",
      repoUrl: "https://github.com/o/p",
      items: [
        {
          id: "1",
          content: "Cut p99 latency 50%.",
          accepted: true,
          regenerated: false,
          evidence: [
            {
              url: "https://github.com/o/p/pull/412",
              kind: "PR",
              tagBg: "",
              tagColor: "",
              repoRef: "o/p#412",
              add: "",
              del: "",
              hasStat: false,
              date: "",
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

describe("renderResumeTex", () => {
  it("produces a complete LaTeX document with sections + evidence links", () => {
    const tex = renderResumeTex({ view, name: "Ada Lovelace" });
    expect(tex).toContain("\\documentclass");
    expect(tex).toContain("\\begin{document}");
    expect(tex).toContain("Ada Lovelace");
    expect(tex).toContain("\\section*{Skills}");
    expect(tex).toContain("\\section*{Selected Work}");
    expect(tex).toContain("\\href{https://github.com/o/p/pull/412}");
    expect(tex).toContain("\\end{document}");
  });

  it("escapes LaTeX specials in content", () => {
    const tex = renderResumeTex({ view, name: "A & B" });
    expect(tex).toContain("A \\& B");
    expect(tex).toContain("Builds tools \\& systems.");
  });

  it("supports the classic template variant", () => {
    expect(renderResumeTex({ view, name: "X", template: "classic" })).toContain("\\scshape");
  });
});

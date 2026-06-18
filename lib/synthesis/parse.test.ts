import { describe, it, expect } from "vitest";
import { parseResumeDraft } from "./parse";

const valid = JSON.stringify({
  headline: "Senior Engineer",
  summary: "Builds reliable systems.",
  items: [
    {
      kind: "project",
      content: "Shipped the ingest pipeline.",
      evidenceUrls: ["https://github.com/acme/repo"],
    },
  ],
});

describe("parseResumeDraft", () => {
  it("parses a plain valid JSON object", () => {
    const draft = parseResumeDraft(valid);
    expect(draft.headline).toBe("Senior Engineer");
    expect(draft.summary).toBe("Builds reliable systems.");
    expect(draft.items).toHaveLength(1);
    expect(draft.items[0].kind).toBe("project");
    expect(draft.items[0].evidenceUrls).toEqual(["https://github.com/acme/repo"]);
  });

  it("parses JSON wrapped in ```json fences", () => {
    const fenced = "```json\n" + valid + "\n```";
    const draft = parseResumeDraft(fenced);
    expect(draft.items[0].content).toBe("Shipped the ingest pipeline.");
  });

  it("parses JSON embedded in surrounding prose", () => {
    const prose = `Here is your resume draft:\n${valid}\nLet me know if you need changes.`;
    const draft = parseResumeDraft(prose);
    expect(draft.headline).toBe("Senior Engineer");
  });

  it("clamps a missing or invalid kind to 'highlight'", () => {
    const raw = JSON.stringify({
      headline: "",
      summary: "",
      items: [
        { content: "no kind here", evidenceUrls: [] },
        { kind: "wizard", content: "bogus kind", evidenceUrls: [] },
      ],
    });
    const draft = parseResumeDraft(raw);
    expect(draft.items).toHaveLength(2);
    expect(draft.items[0].kind).toBe("highlight");
    expect(draft.items[1].kind).toBe("highlight");
  });

  it("drops items with empty content", () => {
    const raw = JSON.stringify({
      headline: "H",
      summary: "S",
      items: [
        { kind: "skill", content: "   ", evidenceUrls: [] },
        { kind: "skill", content: "TypeScript", evidenceUrls: [] },
      ],
    });
    const draft = parseResumeDraft(raw);
    expect(draft.items).toHaveLength(1);
    expect(draft.items[0].content).toBe("TypeScript");
  });

  it("defaults evidenceUrls to [] when missing or non-array", () => {
    const raw = JSON.stringify({
      headline: "",
      summary: "",
      items: [{ kind: "experience", content: "Led a team" }],
    });
    const draft = parseResumeDraft(raw);
    expect(draft.items[0].evidenceUrls).toEqual([]);
  });

  it("filters non-string entries out of evidenceUrls", () => {
    const raw = JSON.stringify({
      headline: "",
      summary: "",
      items: [
        { kind: "project", content: "X", evidenceUrls: ["a", 5, null, "b"] },
      ],
    });
    const draft = parseResumeDraft(raw);
    expect(draft.items[0].evidenceUrls).toEqual(["a", "b"]);
  });

  it("defaults headline and summary to '' when absent", () => {
    const draft = parseResumeDraft(JSON.stringify({ items: [] }));
    expect(draft.headline).toBe("");
    expect(draft.summary).toBe("");
    expect(draft.items).toEqual([]);
  });

  it("treats a non-array items field as empty", () => {
    const draft = parseResumeDraft(
      JSON.stringify({ headline: "H", summary: "S", items: "nope" }),
    );
    expect(draft.items).toEqual([]);
  });

  it("throws when no JSON object is present", () => {
    expect(() => parseResumeDraft("just some prose, no object")).toThrow();
  });

  it("throws when the located JSON fails to parse", () => {
    expect(() => parseResumeDraft('{ "headline": "x", }')).toThrow();
  });
});

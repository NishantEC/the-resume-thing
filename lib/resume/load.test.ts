import { describe, expect, it } from "vitest";
import { parseSkills, tagFor, toEvidenceChip } from "./load";

describe("tagFor", () => {
  it("maps activity types to chip tags", () => {
    expect(tagFor("pull_request").kind).toBe("PR");
    expect(tagFor("issue").kind).toBe("ISSUE");
    expect(tagFor("repo").kind).toBe("GITHUB");
  });
});

describe("toEvidenceChip", () => {
  it("derives repoRef, diff stats, date and source label for a PR", () => {
    const chip = toEvidenceChip({
      type: "pull_request",
      url: "https://github.com/okafor/postcard/pull/412",
      metrics: JSON.stringify({ repo: "okafor/postcard", additions: 1240, deletions: 880 }),
      occurredAt: new Date("2026-05-10T00:00:00Z"),
    });
    expect(chip.kind).toBe("PR");
    expect(chip.repoRef).toBe("okafor/postcard#412");
    expect(chip.hasStat).toBe(true);
    expect(chip.add).toBe("+1,240");
    expect(chip.del).toBe("\u2212880");
    expect(chip.date).toBe("May 2026");
    expect(chip.sourceLabel).toBe("source 412");
  });

  it("omits diff stats when not ingested", () => {
    const chip = toEvidenceChip({
      type: "issue",
      url: "https://github.com/okafor/postcard/issues/377",
      metrics: JSON.stringify({ repo: "okafor/postcard" }),
      occurredAt: null,
    });
    expect(chip.hasStat).toBe(false);
    expect(chip.add).toBe("");
    expect(chip.del).toBe("");
    expect(chip.date).toBe("");
    expect(chip.repoRef).toBe("okafor/postcard#377");
  });

  it("falls back to a profile-style ref when there is no repo or number", () => {
    const chip = toEvidenceChip({
      type: "org",
      url: "https://github.com/dokafor",
      metrics: null,
      occurredAt: null,
    });
    expect(chip.repoRef).toBe("github.com/dokafor");
    expect(chip.sourceLabel).toBe("source");
  });
});

describe("parseSkills", () => {
  it("parses a valid skills array", () => {
    const skills = parseSkills(
      JSON.stringify([{ label: "Languages", list: "Go, TypeScript" }]),
    );
    expect(skills).toEqual([{ label: "Languages", list: "Go, TypeScript" }]);
  });

  it("returns [] for null, non-array, or malformed json", () => {
    expect(parseSkills(null)).toEqual([]);
    expect(parseSkills("not json")).toEqual([]);
    expect(parseSkills(JSON.stringify({ label: "x" }))).toEqual([]);
  });

  it("drops entries missing label or list", () => {
    expect(
      parseSkills(JSON.stringify([{ label: "ok", list: "a" }, { label: "bad" }])),
    ).toEqual([{ label: "ok", list: "a" }]);
  });
});

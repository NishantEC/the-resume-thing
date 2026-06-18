import { describe, it, expect } from "vitest";
import { groupItemsByKind, type Kind, type ResumeItemView } from "./load";

function item(id: string, kind: Kind, order: number): ResumeItemView {
  return { id, kind, content: `content-${id}`, order, evidence: [] };
}

describe("groupItemsByKind", () => {
  it("returns all four buckets empty for empty input", () => {
    const grouped = groupItemsByKind([]);
    expect(Object.keys(grouped).sort()).toEqual([
      "experience",
      "highlight",
      "project",
      "skill",
    ]);
    expect(grouped.experience).toEqual([]);
    expect(grouped.project).toEqual([]);
    expect(grouped.skill).toEqual([]);
    expect(grouped.highlight).toEqual([]);
  });

  it("buckets all four kinds correctly", () => {
    const items = [
      item("a", "experience", 0),
      item("b", "project", 1),
      item("c", "skill", 2),
      item("d", "highlight", 3),
    ];
    const grouped = groupItemsByKind(items);
    expect(grouped.experience.map((i) => i.id)).toEqual(["a"]);
    expect(grouped.project.map((i) => i.id)).toEqual(["b"]);
    expect(grouped.skill.map((i) => i.id)).toEqual(["c"]);
    expect(grouped.highlight.map((i) => i.id)).toEqual(["d"]);
  });

  it("preserves input order within a kind", () => {
    const items = [
      item("e1", "experience", 5),
      item("p1", "project", 0),
      item("e2", "experience", 1),
      item("e3", "experience", 9),
      item("p2", "project", 2),
    ];
    const grouped = groupItemsByKind(items);
    // Order reflects input sequence, not the `order` field.
    expect(grouped.experience.map((i) => i.id)).toEqual(["e1", "e2", "e3"]);
    expect(grouped.project.map((i) => i.id)).toEqual(["p1", "p2"]);
  });
});

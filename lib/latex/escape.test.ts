import { describe, expect, it } from "vitest";
import { escapeLatex } from "./escape";

describe("escapeLatex", () => {
  it("escapes the core LaTeX specials", () => {
    expect(escapeLatex("100% & rising #1")).toBe("100\\% \\& rising \\#1");
    expect(escapeLatex("a_b $x$ {y}")).toBe("a\\_b \\$x\\$ \\{y\\}");
  });

  it("handles backslash, tilde and caret without re-escaping their braces", () => {
    expect(escapeLatex("a\\b")).toBe("a\\textbackslash{}b");
    expect(escapeLatex("~^")).toBe("\\textasciitilde{}\\textasciicircum{}");
  });

  it("leaves ordinary text untouched", () => {
    expect(escapeLatex("Shipped a streaming edge renderer.")).toBe(
      "Shipped a streaming edge renderer.",
    );
  });
});

import { describe, expect, it } from "vitest";
import { resolveModelId } from "./llm";

describe("resolveModelId", () => {
  it("defaults to google + gemini when nothing is set", () => {
    expect(resolveModelId(undefined, undefined)).toEqual({
      provider: "google",
      modelId: "gemini-2.0-flash",
    });
  });

  it("treats empty LLM_MODEL as use-default, never an empty model id", () => {
    // The bug that produced .../models/:generateContent (404).
    expect(resolveModelId("google", "")).toEqual({
      provider: "google",
      modelId: "gemini-2.0-flash",
    });
    expect(resolveModelId("openai", "")).toEqual({
      provider: "openai",
      modelId: "gpt-4o-mini",
    });
  });

  it("treats empty LLM_PROVIDER as google", () => {
    expect(resolveModelId("", "")).toEqual({
      provider: "google",
      modelId: "gemini-2.0-flash",
    });
  });

  it("passes an explicit model through unchanged", () => {
    expect(resolveModelId("google", "gemini-1.5-flash")).toEqual({
      provider: "google",
      modelId: "gemini-1.5-flash",
    });
  });

  it("rejects an unknown provider", () => {
    expect(() => resolveModelId("claude", undefined)).toThrow(
      /Unsupported LLM_PROVIDER/,
    );
  });
});

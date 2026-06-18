import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { bulletSchema, resumeDraftSchema, type ResumeDraft } from "./schema";

/**
 * Synthesis seam. Returns validated structured output, so callers/tests can
 * inject a fake and never touch the network.
 */
export interface LlmClient {
  draftResume(system: string, user: string): Promise<ResumeDraft>;
  rewriteBullet(system: string, user: string): Promise<string>;
}

// Generous budget: thinking models (e.g. Gemini 2.5/3.x flash) spend output
// tokens on reasoning, so a small cap can starve the JSON. Structured-output
// mode (generateObject) keeps the response itself clean JSON.
const MAX_OUTPUT_TOKENS = 8192;

const DEFAULT_MODELS = {
  google: "gemini-3.5-flash",
  openai: "gpt-4o-mini",
} as const;

export type LlmProvider = keyof typeof DEFAULT_MODELS;

/**
 * Resolve provider + model from env. Empty strings count as "unset" (the .env
 * template ships LLM_MODEL="" as the default sentinel), so `||` — not `??` — is
 * deliberate. Pure and exported for testing.
 */
export function resolveModelId(
  providerEnv: string | undefined,
  modelEnv: string | undefined,
): { provider: LlmProvider; modelId: string } {
  const provider = providerEnv || "google";
  if (provider !== "google" && provider !== "openai") {
    throw new Error(
      `Unsupported LLM_PROVIDER "${provider}" — use "google" or "openai".`,
    );
  }
  return { provider, modelId: modelEnv || DEFAULT_MODELS[provider] };
}

/**
 * Vercel AI SDK-backed LlmClient using structured output. Provider via
 * LLM_PROVIDER (google | openai), model via LLM_MODEL; reads the matching
 * provider key from the environment at call time.
 */
export function defaultLlmClient(): LlmClient {
  const { provider, modelId } = resolveModelId(
    process.env.LLM_PROVIDER,
    process.env.LLM_MODEL,
  );
  const model = provider === "openai" ? openai(modelId) : google(modelId);

  return {
    async draftResume(system: string, user: string): Promise<ResumeDraft> {
      const startedAt = Date.now();
      console.log(`[synthesis] llm: requesting draft from ${provider}/${modelId}`);
      const { object } = await generateObject({
        model,
        schema: resumeDraftSchema,
        system,
        prompt: user,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      console.log(
        `[synthesis] llm: received ${object.items.length} items in ${Date.now() - startedAt}ms`,
      );
      return object;
    },

    async rewriteBullet(system: string, user: string): Promise<string> {
      const { object } = await generateObject({
        model,
        schema: bulletSchema,
        system,
        prompt: user,
        maxOutputTokens: 1024,
      });
      return object.content;
    },
  };
}

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Minimal completion seam. Synthesis depends only on this interface so tests
 * can inject a fake and never touch the network.
 */
export interface LlmClient {
  complete(system: string, user: string): Promise<string>;
}

const MAX_OUTPUT_TOKENS = 2000;

const DEFAULT_MODELS = {
  google: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
} as const;

// Provider chosen at call time so the missing-API-key error (raised by the
// AI SDK with a provider-specific message) only surfaces when synthesis runs.
function resolveModel() {
  const provider = process.env.LLM_PROVIDER ?? "google";
  const modelId = process.env.LLM_MODEL;
  if (provider === "openai") return openai(modelId ?? DEFAULT_MODELS.openai);
  if (provider === "google") return google(modelId ?? DEFAULT_MODELS.google);
  throw new Error(
    `Unsupported LLM_PROVIDER "${provider}" — use "google" or "openai".`,
  );
}

/**
 * Vercel AI SDK-backed LlmClient. Provider via LLM_PROVIDER (google | openai),
 * model via LLM_MODEL; reads the matching provider key from the environment
 * (GOOGLE_GENERATIVE_AI_API_KEY / OPENAI_API_KEY).
 */
export function defaultLlmClient(): LlmClient {
  const model = resolveModel();
  return {
    async complete(system: string, user: string): Promise<string> {
      const { text } = await generateText({
        model,
        system,
        prompt: user,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      return text;
    },
  };
}

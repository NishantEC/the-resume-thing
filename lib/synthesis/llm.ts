import Anthropic from "@anthropic-ai/sdk";

/**
 * Minimal completion seam. Synthesis depends only on this interface so tests
 * can inject a fake and never touch the network.
 */
export interface LlmClient {
  complete(system: string, user: string): Promise<string>;
}

const DEFAULT_MODEL = "claude-3-5-sonnet-latest";
const MAX_TOKENS = 2000;

/** Anthropic-backed LlmClient. Reads ANTHROPIC_API_KEY / ANTHROPIC_MODEL from env. */
export function anthropicClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set; cannot construct the Anthropic synthesis client",
    );
  }
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const anthropic = new Anthropic({ apiKey });

  return {
    async complete(system: string, user: string): Promise<string> {
      const response = await anthropic.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
      });
      return response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");
    },
  };
}

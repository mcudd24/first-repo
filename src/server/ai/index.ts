import { AIProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { MockProvider } from "./mock";

let provider: AIProvider | undefined;

/** Returns the configured AI provider; falls back to the offline mock when no key is set. */
export function getAI(): AIProvider {
  if (!provider) {
    provider = process.env.ANTHROPIC_API_KEY ? new ClaudeProvider() : new MockProvider();
  }
  return provider;
}

export * from "./types";

import OpenAI from "openai";
import { aiConfig } from "@/config/ai.config";
import type { AIProvider } from "@/ai/provider/types";
import type { AIGenerateInput, AIGenerateResult, AiErrorCode, AIUsage } from "@/types/ai";

let client: OpenAI | null = null;

export class OpenAiProviderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "OpenAiProviderError";
    this.code = code;
  }
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAiProviderError(
      "AI_API_KEY_MISSING",
      "OPENAI_API_KEY is required for backend AI calls."
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey
    });
  }

  return client;
}

export const openAiProvider = {
  async generate(input: AIGenerateInput): Promise<AIGenerateResult> {
    const startedAt = Date.now();
    const model = input.model ?? aiConfig.defaultModel;

    try {
      const response = await getOpenAiClient().responses.create({
        input: input.prompt,
        max_output_tokens: input.maxTokens ?? aiConfig.defaultMaxTokens,
        model,
        temperature: input.temperature ?? aiConfig.defaultTemperature
      });
      const text = response.output_text.trim();

      if (!text) {
        throw new OpenAiProviderError("AI_EMPTY_RESPONSE", "OpenAI returned an empty response.");
      }

      return {
        content: text,
        model,
        usage: normalizeUsage(response.usage),
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      if (error instanceof OpenAiProviderError) {
        throw error;
      }

      throw new OpenAiProviderError("AI_PROVIDER_ERROR", "OpenAI request failed.");
    }
  },

  async generateText(input: AIGenerateInput): Promise<string> {
    const result = await this.generate(input);

    return result.content;
  }
} satisfies AIProvider & {
  generateText(input: AIGenerateInput): Promise<string>;
};

function normalizeUsage(usage: OpenAI.Responses.ResponseUsage | null | undefined): AIUsage | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.total_tokens
  };
}

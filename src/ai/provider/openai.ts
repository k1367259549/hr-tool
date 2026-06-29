import OpenAI from "openai";
import type { AiErrorCode, AiGenerateTextInput } from "@/types/ai";

const defaultModel = "gpt-4.1";
const defaultTemperature = 0.2;

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
  async generateText(input: AiGenerateTextInput): Promise<string> {
    try {
      const response = await getOpenAiClient().responses.create({
        input: input.prompt,
        model: input.model ?? defaultModel,
        temperature: input.temperature ?? defaultTemperature
      });
      const text = response.output_text.trim();

      if (!text) {
        throw new OpenAiProviderError("AI_EMPTY_RESPONSE", "OpenAI returned an empty response.");
      }

      return text;
    } catch (error) {
      if (error instanceof OpenAiProviderError) {
        throw error;
      }

      throw new OpenAiProviderError("AI_PROVIDER_ERROR", "OpenAI request failed.");
    }
  }
};

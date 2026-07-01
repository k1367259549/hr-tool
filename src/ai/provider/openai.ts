import OpenAI from "openai";
import { aiConfig } from "@/config/ai.config";
import { envConfig } from "@/config/env.config";
import type { AIProvider } from "@/ai/provider/types";
import { logger } from "@/lib/logger";
import type { AIGenerateInput, AIGenerateResult, AiErrorCode, AIUsage } from "@/types/ai";
import { validateOpenAIEnvironment } from "@/utils/configValidation";

let client: OpenAI | null = null;
let clientBaseUrl: string | undefined;

export class OpenAiProviderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "OpenAiProviderError";
    this.code = code;
  }
}

function getOpenAiClient(): OpenAI {
  if (!envConfig.openAiApiKey) {
    throw new OpenAiProviderError(
      "AI_API_KEY_MISSING",
      "OPENAI_API_KEY 未配置。请在后端环境变量中配置 API Key 后重启服务。"
    );
  }

  validateOpenAIEnvironment();

  if (!client || clientBaseUrl !== envConfig.openAiBaseUrl) {
    client = new OpenAI({
      apiKey: envConfig.openAiApiKey,
      baseURL: envConfig.openAiBaseUrl,
      timeout: aiConfig.timeoutMs
    });
    clientBaseUrl = envConfig.openAiBaseUrl;
  }

  return client;
}

export const openAiProvider = {
  async generate(input: AIGenerateInput): Promise<AIGenerateResult> {
    const startedAt = Date.now();
    const model = input.model ?? aiConfig.defaultModel;

    try {
      logger.info("OpenAI request started.", {
        feature: input.feature ?? "unknown",
        model
      });

      const response = await getOpenAiClient().responses.create({
        input: input.prompt,
        max_output_tokens: input.maxTokens ?? aiConfig.defaultMaxTokens,
        model,
        temperature: input.temperature ?? aiConfig.defaultTemperature
      }, {
        timeout: aiConfig.timeoutMs
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
        logger.error("OpenAI request failed.", {
          errorMessage: error.message,
          feature: input.feature ?? "unknown",
          model
        });

        throw error;
      }

      logger.error("OpenAI request failed.", {
        errorMessage: "OpenAI request failed.",
        feature: input.feature ?? "unknown",
        model
      });

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

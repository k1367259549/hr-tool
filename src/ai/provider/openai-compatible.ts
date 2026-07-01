import OpenAI from "openai";
import { aiConfig } from "@/config/ai.config";
import { envConfig } from "@/config/env.config";
import type { AIProvider } from "@/ai/provider/types";
import { logger } from "@/lib/logger";
import type { AIGenerateInput, AIGenerateResult, AiErrorCode, AIUsage } from "@/types/ai";
import { validateOpenAICompatibleEnvironment } from "@/utils/configValidation";

let client: OpenAI | null = null;
let clientBaseUrl: string | undefined;

export class OpenAiCompatibleProviderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "OpenAiCompatibleProviderError";
    this.code = code;
  }
}

function getOpenAiCompatibleClient(): OpenAI {
  const apiKey = envConfig.aiApiKey ?? envConfig.openAiApiKey;
  const baseURL = normalizeCompatibleBaseUrl(envConfig.aiBaseUrl ?? envConfig.openAiBaseUrl);

  if (!apiKey) {
    throw new OpenAiCompatibleProviderError(
      "AI_API_KEY_MISSING",
      "AI_API_KEY 未配置。请在后端环境变量中配置中转站令牌后重启服务。"
    );
  }

  if (!baseURL) {
    throw new OpenAiCompatibleProviderError(
      "AI_BASE_URL_MISSING",
      "AI_BASE_URL 未配置。请在后端环境变量中配置中转站 Base URL 后重启服务。"
    );
  }

  validateOpenAICompatibleEnvironment();

  if (!client || clientBaseUrl !== baseURL) {
    client = new OpenAI({
      apiKey,
      baseURL,
      timeout: aiConfig.timeoutMs
    });
    clientBaseUrl = baseURL;
  }

  return client;
}

export const openAiCompatibleProvider = {
  async generate(input: AIGenerateInput): Promise<AIGenerateResult> {
    const startedAt = Date.now();
    const model = input.model ?? aiConfig.defaultModel;

    try {
      logger.info("OpenAI-compatible request started.", {
        baseUrlConfigured: Boolean(envConfig.aiBaseUrl ?? envConfig.openAiBaseUrl),
        feature: input.feature ?? "unknown",
        model
      });

      const response = await getOpenAiCompatibleClient().chat.completions.create({
        max_tokens: input.maxTokens ?? aiConfig.defaultMaxTokens,
        messages: [
          {
            content: input.prompt,
            role: "user"
          }
        ],
        model,
        temperature: input.temperature ?? aiConfig.defaultTemperature
      }, {
        timeout: aiConfig.timeoutMs
      });
      const text = response.choices[0]?.message.content?.trim() ?? "";

      if (!text) {
        throw new OpenAiCompatibleProviderError(
          "AI_EMPTY_RESPONSE",
          "OpenAI-compatible provider returned an empty response."
        );
      }

      return {
        content: text,
        model,
        usage: normalizeUsage(response.usage),
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      if (error instanceof OpenAiCompatibleProviderError) {
        logger.error("OpenAI-compatible request failed.", {
          errorMessage: error.message,
          feature: input.feature ?? "unknown",
          model
        });

        throw error;
      }

      logger.error("OpenAI-compatible request failed.", {
        errorMessage: "OpenAI-compatible request failed.",
        feature: input.feature ?? "unknown",
        model
      });

      throw new OpenAiCompatibleProviderError(
        "AI_PROVIDER_ERROR",
        "OpenAI-compatible request failed."
      );
    }
  }
} satisfies AIProvider;

function normalizeUsage(
  usage:
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      }
    | null
    | undefined
): AIUsage | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens
  };
}

function normalizeCompatibleBaseUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim().replace(/\/+$/, "");

  try {
    const url = new URL(trimmedValue);

    if (url.pathname === "" || url.pathname === "/") {
      return `${trimmedValue}/v1`;
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
}

import { openAiProvider } from "@/ai/provider/openai";
import { openAiCompatibleProvider } from "@/ai/provider/openai-compatible";
import type { AIProvider } from "@/ai/provider/types";
import type { AiErrorCode } from "@/types/ai";
import { isSupportedAIProvider } from "@/utils/configValidation";

export class AIProviderFactoryError extends Error {
  readonly code: AiErrorCode;

  constructor(message: string) {
    super(message);
    this.name = "AIProviderFactoryError";
    this.code = "AI_PROVIDER_UNSUPPORTED";
  }
}

export function getAIProvider(providerName: string): AIProvider {
  const normalizedProviderName = providerName.trim().toLowerCase();

  if (isSupportedAIProvider(normalizedProviderName) && normalizedProviderName === "openai") {
    return openAiProvider;
  }

  if (
    isSupportedAIProvider(normalizedProviderName) &&
    normalizedProviderName === "openai-compatible"
  ) {
    return openAiCompatibleProvider;
  }

  throw new AIProviderFactoryError(`Unsupported AI provider: ${providerName}.`);
}

import { envConfig } from "@/config/env.config";
import type { AIConfig } from "@/types/config";

export const aiConfig: AIConfig = {
  defaultProvider: readProviderEnv(envConfig.aiProvider, "openai"),
  defaultModel: readStringEnv(resolveModelEnv(), "gpt-4.1"),
  defaultTemperature: readNumberEnv(envConfig.openAiTemperature, 0.2),
  defaultMaxTokens: readIntegerEnv(envConfig.openAiMaxTokens, 2000),
  timeoutMs: readIntegerEnv(envConfig.aiTimeoutMs, 120000),
  maxRetries: readNonNegativeIntegerEnv(envConfig.aiMaxRetries, 2),
  supportedProviders: ["openai", "openai-compatible"]
};

function readProviderEnv(value: string | undefined, fallback: "openai"): "openai" | "openai-compatible" {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === "openai-compatible") {
    return "openai-compatible";
  }

  return fallback;
}

function resolveModelEnv(): string | undefined {
  if (envConfig.aiProvider?.trim().toLowerCase() === "openai-compatible") {
    return envConfig.aiModel ?? envConfig.openAiModel;
  }

  return envConfig.openAiModel;
}

function readStringEnv(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function readNumberEnv(value: string | undefined, fallback: number): number {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function readIntegerEnv(value: string | undefined, fallback: number): number {
  const parsedValue = readNumberEnv(value, fallback);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function readNonNegativeIntegerEnv(value: string | undefined, fallback: number): number {
  const parsedValue = readNumberEnv(value, fallback);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

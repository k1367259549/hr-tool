import { envConfig } from "@/config/env.config";
import type { AIConfig } from "@/types/config";

export const aiConfig: AIConfig = {
  defaultProvider: "openai",
  defaultModel: readStringEnv(envConfig.openAiModel, "gpt-4.1"),
  defaultTemperature: readNumberEnv(envConfig.openAiTemperature, 0.2),
  defaultMaxTokens: readIntegerEnv(envConfig.openAiMaxTokens, 2000),
  timeoutMs: 15000,
  maxRetries: 2,
  supportedProviders: ["openai"]
};

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

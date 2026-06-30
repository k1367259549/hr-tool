import type { AIConfig } from "@/types/config";

export const aiConfig: AIConfig = {
  defaultProvider: "openai",
  defaultModel: "gpt-4.1",
  defaultTemperature: 0.2,
  defaultMaxTokens: 2000,
  timeoutMs: 15000,
  maxRetries: 2,
  supportedProviders: ["openai"]
};

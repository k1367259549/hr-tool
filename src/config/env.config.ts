import type { AppEnvironment, EnvConfig } from "@/types/config";

export const envConfig: EnvConfig = {
  aiApiKey: process.env.AI_API_KEY,
  aiBaseUrl: process.env.AI_BASE_URL,
  aiModel: process.env.AI_MODEL,
  aiProvider: process.env.AI_PROVIDER,
  databaseUrl: process.env.DATABASE_URL,
  openAiBaseUrl: process.env.OPENAI_BASE_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL,
  openAiTemperature: process.env.OPENAI_TEMPERATURE,
  openAiMaxTokens: process.env.OPENAI_MAX_TOKENS,
  aiTimeoutMs: process.env.AI_TIMEOUT_MS ?? process.env.OPENAI_TIMEOUT_MS,
  aiMaxRetries: process.env.AI_MAX_RETRIES,
  nodeEnv: normalizeNodeEnv(process.env.NODE_ENV)
};

function normalizeNodeEnv(value: string | undefined): AppEnvironment {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

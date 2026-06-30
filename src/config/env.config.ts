import type { AppEnvironment, EnvConfig } from "@/types/config";

export const envConfig: EnvConfig = {
  databaseUrl: process.env.DATABASE_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL,
  openAiTemperature: process.env.OPENAI_TEMPERATURE,
  openAiMaxTokens: process.env.OPENAI_MAX_TOKENS,
  nodeEnv: normalizeNodeEnv(process.env.NODE_ENV)
};

function normalizeNodeEnv(value: string | undefined): AppEnvironment {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

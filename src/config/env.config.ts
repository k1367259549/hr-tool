import type { AppEnvironment, EnvConfig } from "@/types/config";

export const envConfig: EnvConfig = {
  databaseUrl: process.env.DATABASE_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: normalizeNodeEnv(process.env.NODE_ENV)
};

function normalizeNodeEnv(value: string | undefined): AppEnvironment {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

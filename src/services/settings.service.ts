import { access } from "node:fs/promises";
import path from "node:path";
import packageJson from "../../package.json";
import { logRepository } from "@/repositories/log.repository";
import type { SettingsStatus } from "@/types/settings";

const appName = "HR Daily AI";
const aiProvider = "OpenAI";
const aiModel = "gpt-4.1";
const databaseProvider = "PostgreSQL";
const promptsDirectory = path.resolve(process.cwd(), "prompts");

export const settingsService = {
  async getStatus(): Promise<SettingsStatus> {
    const [databaseConnected, promptDirectoryAvailable] = await Promise.all([
      checkDatabaseConnection(),
      checkPromptDirectory()
    ]);
    const environment = process.env.NODE_ENV ?? "development";
    const openAiApiKeyConfigured = isConfigured(process.env.OPENAI_API_KEY);
    const databaseUrlConfigured = isConfigured(process.env.DATABASE_URL);

    return {
      appName,
      version: packageJson.version,
      environment,
      ai: {
        provider: aiProvider,
        model: aiModel,
        apiKeyConfigured: openAiApiKeyConfigured,
        promptDirectoryAvailable
      },
      database: {
        provider: databaseProvider,
        connected: databaseConnected
      },
      environmentStatus: {
        nodeEnv: environment,
        databaseUrlConfigured,
        openAiApiKeyConfigured
      },
      developer: {
        runtime: process.version,
        deployment: "Docker Compose",
        configurationMode: "Read-only V1"
      }
    };
  }
};

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await logRepository.findMany({
      limit: 1
    });

    return true;
  } catch {
    return false;
  }
}

async function checkPromptDirectory(): Promise<boolean> {
  try {
    await access(promptsDirectory);

    return true;
  } catch {
    return false;
  }
}

function isConfigured(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

import { access } from "node:fs/promises";
import path from "node:path";
import { aiConfig } from "@/config/ai.config";
import { appConfig } from "@/config/app.config";
import { envConfig } from "@/config/env.config";
import { logRepository } from "@/repositories/log.repository";
import type { SettingsStatus } from "@/types/settings";
import { isConfigured } from "@/utils/configValidation";

const promptsDirectory = path.resolve(process.cwd(), "prompts");

export const settingsService = {
  async getStatus(): Promise<SettingsStatus> {
    const [databaseConnected, promptDirectoryAvailable] = await Promise.all([
      checkDatabaseConnection(),
      checkPromptDirectory()
    ]);
    const openAiApiKeyConfigured = isConfigured(envConfig.openAiApiKey);
    const databaseUrlConfigured = isConfigured(envConfig.databaseUrl);

    return {
      appName: appConfig.appName,
      version: appConfig.appVersion,
      environment: appConfig.environment,
      ai: {
        provider: aiConfig.defaultProvider,
        model: aiConfig.defaultModel,
        apiKeyConfigured: openAiApiKeyConfigured,
        status: openAiApiKeyConfigured ? "ready" : "missing_api_key",
        promptDirectoryAvailable
      },
      database: {
        provider: appConfig.databaseProvider,
        connected: databaseConnected
      },
      environmentStatus: {
        nodeEnv: envConfig.nodeEnv,
        databaseUrlConfigured,
        openAiApiKeyConfigured
      },
      developer: {
        runtime: process.version,
        deployment: appConfig.deployment,
        configurationMode: appConfig.configurationMode
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

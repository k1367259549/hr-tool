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
    const aiApiKeyConfigured = isConfigured(envConfig.aiApiKey);
    const aiBaseUrlConfigured = isConfigured(envConfig.aiBaseUrl);
    const openAiApiKeyConfigured = isConfigured(envConfig.openAiApiKey);
    const openAiBaseUrlConfigured = isConfigured(envConfig.openAiBaseUrl);
    const activeApiKeyConfigured =
      aiConfig.defaultProvider === "openai-compatible"
        ? aiApiKeyConfigured || openAiApiKeyConfigured
        : openAiApiKeyConfigured;
    const activeBaseUrl = getActiveBaseUrl();
    const activeBaseUrlConfigured =
      aiConfig.defaultProvider === "openai-compatible"
        ? aiBaseUrlConfigured || openAiBaseUrlConfigured
        : openAiBaseUrlConfigured;
    const databaseUrlConfigured = isConfigured(envConfig.databaseUrl);

    return {
      appName: appConfig.appName,
      version: appConfig.appVersion,
      environment: appConfig.environment,
      ai: {
        provider: aiConfig.defaultProvider,
        baseUrl: activeBaseUrl,
        model: aiConfig.defaultModel,
        apiKeyConfigured: activeApiKeyConfigured,
        status: getAIStatus(activeApiKeyConfigured, activeBaseUrlConfigured),
        promptDirectoryAvailable
      },
      database: {
        provider: appConfig.databaseProvider,
        connected: databaseConnected
      },
      environmentStatus: {
        nodeEnv: envConfig.nodeEnv,
        databaseUrlConfigured,
        aiApiKeyConfigured,
        aiBaseUrlConfigured,
        openAiBaseUrlConfigured,
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

function getActiveBaseUrl(): string {
  if (aiConfig.defaultProvider === "openai-compatible") {
    return envConfig.aiBaseUrl ?? envConfig.openAiBaseUrl ?? "未配置";
  }

  return envConfig.openAiBaseUrl ?? "OpenAI 默认地址";
}

function getAIStatus(
  apiKeyConfigured: boolean,
  baseUrlConfigured: boolean
): SettingsStatus["ai"]["status"] {
  if (!apiKeyConfigured) {
    return "missing_api_key";
  }

  if (aiConfig.defaultProvider === "openai-compatible" && !baseUrlConfigured) {
    return "missing_base_url";
  }

  return "ready";
}

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

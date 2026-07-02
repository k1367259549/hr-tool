export type SettingsStatus = {
  appName: string;
  version: string;
  environment: string;
  ai: {
    provider: string;
    baseUrl: string;
    model: string;
    apiKeyConfigured: boolean;
    status: "ready" | "missing_api_key" | "missing_base_url";
    promptDirectoryAvailable: boolean;
  };
  database: {
    provider: string;
    connected: boolean;
  };
  environmentStatus: {
    nodeEnv: string;
    databaseUrlConfigured: boolean;
    aiApiKeyConfigured: boolean;
    aiBaseUrlConfigured: boolean;
    openAiApiKeyConfigured: boolean;
    openAiBaseUrlConfigured: boolean;
  };
  developer: {
    runtime: string;
    deployment: string;
    configurationMode: string;
  };
};

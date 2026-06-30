export type SettingsStatus = {
  appName: string;
  version: string;
  environment: string;
  ai: {
    provider: string;
    model: string;
    apiKeyConfigured: boolean;
    status: "ready" | "missing_api_key";
    promptDirectoryAvailable: boolean;
  };
  database: {
    provider: string;
    connected: boolean;
  };
  environmentStatus: {
    nodeEnv: string;
    databaseUrlConfigured: boolean;
    openAiApiKeyConfigured: boolean;
  };
  developer: {
    runtime: string;
    deployment: string;
    configurationMode: string;
  };
};

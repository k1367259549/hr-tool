export type AppEnvironment = "development" | "production" | "test";

export type AppConfig = {
  appName: string;
  appVersion: string;
  environment: AppEnvironment;
  databaseProvider: string;
  deployment: string;
  configurationMode: string;
};

export type EnvConfig = {
  databaseUrl: string | undefined;
  openAiApiKey: string | undefined;
  nodeEnv: AppEnvironment;
};

export type AIProviderName = "openai";

export type AIConfig = {
  defaultProvider: AIProviderName;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  timeoutMs: number;
  maxRetries: number;
  supportedProviders: readonly AIProviderName[];
};

export type FeatureFlags = {
  enableAIReview: boolean;
  enablePlanner: boolean;
  enableKnowledgeExtraction: boolean;
  enableMarkdownExport: boolean;
  enableGlobalSearch: boolean;
};

export type ConfigValidationIssue = {
  field: string;
  message: string;
};

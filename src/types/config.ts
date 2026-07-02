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
  aiApiKey: string | undefined;
  aiBaseUrl: string | undefined;
  aiModel: string | undefined;
  aiProvider: string | undefined;
  databaseUrl: string | undefined;
  openAiBaseUrl: string | undefined;
  openAiApiKey: string | undefined;
  openAiModel: string | undefined;
  openAiTemperature: string | undefined;
  openAiMaxTokens: string | undefined;
  aiTimeoutMs: string | undefined;
  aiMaxRetries: string | undefined;
  nodeEnv: AppEnvironment;
};

export type AIProviderName = "openai" | "openai-compatible";

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

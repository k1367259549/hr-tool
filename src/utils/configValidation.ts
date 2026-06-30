import { aiConfig } from "@/config/ai.config";
import { envConfig } from "@/config/env.config";
import { featureFlags } from "@/config/features.config";
import type { AIProviderName, ConfigValidationIssue } from "@/types/config";

export class ConfigValidationError extends Error {
  readonly issues: ConfigValidationIssue[];

  constructor(message: string, issues: ConfigValidationIssue[]) {
    super(message);
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

export function validateConfig(): void {
  const issues = collectConfigValidationIssues();

  if (issues.length > 0) {
    throw new ConfigValidationError("Configuration is invalid.", issues);
  }
}

export function validateOpenAIEnvironment(): void {
  const issues = collectConfigValidationIssues().filter(
    (issue) => issue.field === "OPENAI_API_KEY" || issue.field === "defaultProvider"
  );

  if (issues.length > 0) {
    throw new ConfigValidationError("OpenAI configuration is invalid.", issues);
  }
}

export function isConfigured(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSupportedAIProvider(providerName: string): providerName is AIProviderName {
  return aiConfig.supportedProviders.includes(providerName as AIProviderName);
}

function collectConfigValidationIssues(): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (!isConfigured(envConfig.databaseUrl)) {
    issues.push({
      field: "DATABASE_URL",
      message: "DATABASE_URL is required."
    });
  }

  if (isAnyAIFeatureEnabled() && !isConfigured(envConfig.openAiApiKey)) {
    issues.push({
      field: "OPENAI_API_KEY",
      message: "OPENAI_API_KEY is required when AI features are enabled."
    });
  }

  if (!isSupportedAIProvider(aiConfig.defaultProvider)) {
    issues.push({
      field: "defaultProvider",
      message: `Unsupported AI provider: ${aiConfig.defaultProvider}.`
    });
  }

  if (aiConfig.defaultTemperature < 0 || aiConfig.defaultTemperature > 2) {
    issues.push({
      field: "defaultTemperature",
      message: "defaultTemperature must be between 0 and 2."
    });
  }

  if (!Number.isInteger(aiConfig.maxRetries) || aiConfig.maxRetries < 0) {
    issues.push({
      field: "maxRetries",
      message: "maxRetries must be a non-negative integer."
    });
  }

  return issues;
}

function isAnyAIFeatureEnabled(): boolean {
  return (
    featureFlags.enableAIReview ||
    featureFlags.enablePlanner ||
    featureFlags.enableKnowledgeExtraction
  );
}

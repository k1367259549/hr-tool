import {
  createLuminAIConfig,
  createLuminAIEvaluationProvider,
  type LuminAIProviderConfig,
  type LuminAIProviderOptions
} from "@/lib/evaluation/luminai-config-adapter";
import {
  openAICompatibleEndpointModes,
  type OpenAICompatibleEndpointMode
} from "@/lib/evaluation/openai-compatible-provider";
import type { EvaluationProvider } from "@/lib/evaluation/provider-interface";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";

export type EvaluationProviderRuntimeEnv = Record<string, string | undefined>;

export type EvaluationProviderRuntimeProvider =
  | "openai-compatible"
  | "rule-based";

export type EvaluationProviderRuntimeSafeSummary =
  | {
      provider: "rule-based";
      requiresApiKey: false;
    }
  | {
      provider: "openai-compatible";
      baseUrl: string;
      hasApiKey: boolean;
      model: string;
      endpointMode?: OpenAICompatibleEndpointMode;
      requiresApiKey: true;
      timeoutMs: number;
    };

export type RuleBasedEvaluationProviderRuntimeConfig = {
  provider: "rule-based";
  safeSummary: EvaluationProviderRuntimeSafeSummary;
};

export type OpenAICompatibleEvaluationProviderRuntimeConfig = {
  provider: "openai-compatible";
  luminAIConfig: LuminAIProviderConfig;
  safeSummary: EvaluationProviderRuntimeSafeSummary;
};

export type EvaluationProviderRuntimeConfig =
  | RuleBasedEvaluationProviderRuntimeConfig
  | OpenAICompatibleEvaluationProviderRuntimeConfig;

export type EvaluationProviderRuntimeOptions = LuminAIProviderOptions;

export function readEvaluationProviderRuntimeConfig(
  env: EvaluationProviderRuntimeEnv
): EvaluationProviderRuntimeConfig {
  const provider = parseProvider(env.AI_PROVIDER);

  if (provider === "rule-based") {
    return {
      provider,
      safeSummary: {
        provider,
        requiresApiKey: false
      }
    };
  }

  const baseUrl = requireEnvValue(env.AI_BASE_URL, "AI_BASE_URL");
  const apiKey = requireEnvValue(env.AI_API_KEY, "AI_API_KEY");
  const luminAIConfig = createLuminAIConfig({
    apiKey,
    baseUrl,
    model: normalizeOptionalEnvValue(env.AI_MODEL),
    endpointMode: parseEndpointMode(env.AI_ENDPOINT_MODE),
    timeoutMs: parseOptionalPositiveInteger(env.AI_TIMEOUT_MS)
  });

  return {
    provider,
    luminAIConfig,
    safeSummary: {
      provider,
      baseUrl: luminAIConfig.baseUrl,
      hasApiKey: true,
      model: luminAIConfig.model,
      endpointMode: luminAIConfig.endpointMode,
      requiresApiKey: true,
      timeoutMs: luminAIConfig.timeoutMs
    }
  };
}

function parseEndpointMode(value: string | undefined): OpenAICompatibleEndpointMode | undefined {
  const endpointMode = normalizeOptionalEnvValue(value);

  if (endpointMode === undefined) {
    return undefined;
  }

  if (openAICompatibleEndpointModes.includes(endpointMode as OpenAICompatibleEndpointMode)) {
    return endpointMode as OpenAICompatibleEndpointMode;
  }

  throw new Error("AI_ENDPOINT_MODE must be chat-completions or responses.");
}

export function createEvaluationProviderFromRuntimeConfig(
  config: EvaluationProviderRuntimeConfig,
  options: EvaluationProviderRuntimeOptions = {}
): EvaluationProvider {
  if (config.provider === "rule-based") {
    return new RuleBasedEvaluationProvider({
      now: options.now,
      version: options.version
    });
  }

  return createLuminAIEvaluationProvider(config.luminAIConfig, options);
}

function parseProvider(
  value: string | undefined
): EvaluationProviderRuntimeProvider {
  const provider = normalizeOptionalEnvValue(value) ?? "rule-based";

  if (provider === "rule-based" || provider === "openai-compatible") {
    return provider;
  }

  throw new Error("AI_PROVIDER must be openai-compatible or rule-based.");
}

function requireEnvValue(value: string | undefined, name: string): string {
  const normalized = normalizeOptionalEnvValue(value);

  if (!normalized) {
    throw new Error(`${name} is required for openai-compatible provider.`);
  }

  return normalized;
}

function normalizeOptionalEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  const normalized = normalizeOptionalEnvValue(value);

  if (normalized === undefined) {
    return undefined;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("AI_TIMEOUT_MS must be a positive integer.");
  }

  return parsed;
}

import { z } from "zod";
import { OpenAICompatibleEvaluationProvider } from "@/lib/evaluation/openai-compatible-provider";

const DEFAULT_LUMINAI_MODEL = "gpt-5.5";
const DEFAULT_TIMEOUT_MS = 30_000;

type OpenAICompatibleProviderOptions = ConstructorParameters<
  typeof OpenAICompatibleEvaluationProvider
>[0];

export type LuminAIConfigInput = {
  baseUrl: string;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
};

export type LuminAIProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
};

export type LuminAIProviderOptions = Pick<
  OpenAICompatibleProviderOptions,
  "fetchImpl" | "now" | "version"
>;

const LuminAIConfigInputSchema = z
  .object({
    baseUrl: z
      .string({
        required_error: "baseUrl is required."
      })
      .trim()
      .min(1, "baseUrl is required.")
      .refine((value) => isValidHttpUrl(value), {
        message: "baseUrl must be a valid URL."
      }),
    apiKey: z
      .string({
        required_error: "apiKey is required."
      })
      .trim()
      .min(1, "apiKey is required."),
    model: z
      .string()
      .trim()
      .min(1, "model is required.")
      .optional(),
    timeoutMs: z
      .number()
      .int("timeoutMs must be an integer.")
      .positive("timeoutMs must be a positive number.")
      .optional()
  })
  .strict();

export function createLuminAIConfig(input: LuminAIConfigInput): LuminAIProviderConfig {
  const result = LuminAIConfigInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "LuminAI provider config is invalid."
    );
  }

  return {
    apiKey: result.data.apiKey,
    baseUrl: normalizeBaseUrl(result.data.baseUrl),
    model: result.data.model ?? DEFAULT_LUMINAI_MODEL,
    timeoutMs: result.data.timeoutMs ?? DEFAULT_TIMEOUT_MS
  };
}

export function createLuminAIEvaluationProvider(
  config: LuminAIProviderConfig,
  options: LuminAIProviderOptions = {}
): OpenAICompatibleEvaluationProvider {
  return new OpenAICompatibleEvaluationProvider({
    ...config,
    ...options
  });
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

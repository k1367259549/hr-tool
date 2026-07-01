export type AiErrorCode =
  | "AI_API_KEY_MISSING"
  | "AI_BASE_URL_MISSING"
  | "AI_PROVIDER_ERROR"
  | "AI_PROVIDER_UNSUPPORTED"
  | "AI_EMPTY_RESPONSE"
  | "AI_TIMEOUT"
  | "AI_VALIDATION_ERROR"
  | "PROMPT_NOT_FOUND"
  | "PROMPT_PATH_INVALID"
  | "JSON_PARSE_ERROR";

export type AIUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export interface AIGenerateInput {
  prompt: string;
  feature?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIGenerateResult {
  content: string;
  model: string;
  usage?: AIUsage;
  latencyMs?: number;
  retryCount?: number;
}

export type AiGenerateTextInput = AIGenerateInput;

export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonArray = JsonValue[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type PromptVariableValue = JsonValue;

export type PromptVariables = Record<string, PromptVariableValue>;

export type LoadPromptInput = {
  fileName: string;
  variables?: PromptVariables;
};

export type PromptCategory =
  | "candidate-understanding"
  | "daily-workspace"
  | "job-understanding"
  | "knowledge"
  | "planner"
  | "recruit-together"
  | "resume-evaluation"
  | "review"
  | "spreadsheet-analysis";

export type PromptMetadata = {
  fileName: string;
  path: string;
  version: string;
  category: PromptCategory;
};

export type RegisteredPrompt = PromptMetadata & {
  template: string;
};

export type AiPromptGenerationInput = {
  feature?: string;
  promptFile: string;
  variables?: PromptVariables;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  workflow?: string;
  promptCategory?: PromptCategory;
  recruitingContext?: JsonValue;
};

export type AiValidatedJsonGenerationInput<TOutput> = AiPromptGenerationInput & {
  validate: (value: JsonValue) => TOutput;
};

export type AiValidatedJsonGenerationResult<TOutput> = {
  output: TOutput;
  rawOutput: string;
  model: string;
  provider: string;
  prompt: PromptMetadata;
  generationTimeMs: number;
  retryCount: number;
  providerRetryCount: number;
  validationResult: "success";
};

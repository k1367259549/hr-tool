export type AiErrorCode =
  | "AI_API_KEY_MISSING"
  | "AI_PROVIDER_ERROR"
  | "AI_PROVIDER_UNSUPPORTED"
  | "AI_EMPTY_RESPONSE"
  | "AI_TIMEOUT"
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

export type AiPromptGenerationInput = {
  feature?: string;
  promptFile: string;
  variables?: PromptVariables;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
};

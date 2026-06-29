export type AiErrorCode =
  | "AI_API_KEY_MISSING"
  | "AI_PROVIDER_ERROR"
  | "AI_EMPTY_RESPONSE"
  | "PROMPT_NOT_FOUND"
  | "PROMPT_PATH_INVALID"
  | "JSON_PARSE_ERROR";

export type AiGenerateTextInput = {
  prompt: string;
  model?: string;
  temperature?: number;
};

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
  promptFile: string;
  variables?: PromptVariables;
  model?: string;
  temperature?: number;
};

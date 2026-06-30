export type PromptName = "review" | "planner" | "knowledge";

export type PromptDefinition = {
  name: PromptName;
  fileName: string;
  path: string;
};

export type PromptValidationResult = {
  exists: boolean;
  valid: boolean;
  hasInputPlaceholder: boolean;
  hasJsonOnlyInstruction: boolean;
  isNotEmpty: boolean;
  warnings: string[];
};

export type PromptStatusItem = PromptDefinition & PromptValidationResult;

export type PromptStatusResponse = {
  prompts: PromptStatusItem[];
};

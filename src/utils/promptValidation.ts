import type { PromptValidationResult } from "@/types/prompt";

const inputPlaceholderPattern = /{{\s*INPUT\s*}}/;
const jsonOnlyPatterns = [
  /return\s+only\s+(valid\s+)?json/i,
  /json-only/i,
  /output\s+must\s+be\s+valid\s+json/i,
  /do\s+not\s+include\s+markdown/i
];

export function validatePromptContent(content: string | null): PromptValidationResult {
  const exists = content !== null;
  const normalizedContent = content ?? "";
  const isNotEmpty = normalizedContent.trim().length > 0;
  const hasInputPlaceholder = inputPlaceholderPattern.test(normalizedContent);
  const hasJsonOnlyInstruction = jsonOnlyPatterns.some((pattern) =>
    pattern.test(normalizedContent)
  );
  const warnings = createPromptWarnings({
    exists,
    hasInputPlaceholder,
    hasJsonOnlyInstruction,
    isNotEmpty
  });

  return {
    exists,
    valid: exists && isNotEmpty && hasInputPlaceholder && hasJsonOnlyInstruction,
    hasInputPlaceholder,
    hasJsonOnlyInstruction,
    isNotEmpty,
    warnings
  };
}

function createPromptWarnings(input: {
  exists: boolean;
  hasInputPlaceholder: boolean;
  hasJsonOnlyInstruction: boolean;
  isNotEmpty: boolean;
}): string[] {
  const warnings: string[] = [];

  if (!input.exists) {
    warnings.push("提示词文件缺失。");
  }

  if (input.exists && !input.isNotEmpty) {
    warnings.push("提示词文件为空。");
  }

  if (input.exists && !input.hasInputPlaceholder) {
    warnings.push("提示词缺少 {{INPUT}} 占位符。");
  }

  if (input.exists && !input.hasJsonOnlyInstruction) {
    warnings.push("提示词没有明确要求仅输出 JSON。");
  }

  return warnings;
}

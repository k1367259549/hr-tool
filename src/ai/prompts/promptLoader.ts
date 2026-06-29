import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AiErrorCode, LoadPromptInput, PromptVariableValue } from "@/types/ai";

const promptsDirectory = path.resolve(process.cwd(), "prompts");

export class PromptLoaderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "PromptLoaderError";
    this.code = code;
  }
}

export async function loadPrompt(input: LoadPromptInput): Promise<string> {
  const promptPath = resolvePromptPath(input.fileName);

  try {
    const template = await readFile(promptPath, "utf8");

    return applyPromptVariables(template, input.variables ?? {});
  } catch (error) {
    if (error instanceof PromptLoaderError) {
      throw error;
    }

    throw new PromptLoaderError(
      "PROMPT_NOT_FOUND",
      `Prompt file not found: ${input.fileName}.`
    );
  }
}

function resolvePromptPath(fileName: string): string {
  const promptPath = path.resolve(promptsDirectory, fileName);
  const relativePath = path.relative(promptsDirectory, promptPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new PromptLoaderError("PROMPT_PATH_INVALID", "Prompt path must stay inside /prompts.");
  }

  return promptPath;
}

function applyPromptVariables(
  template: string,
  variables: Record<string, PromptVariableValue>
): string {
  return Object.entries(variables).reduce<string>((result, [key, value]) => {
    const token = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");

    return result.replace(token, formatPromptVariable(value));
  }, template);
}

function formatPromptVariable(value: PromptVariableValue): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

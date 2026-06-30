import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PromptDefinition, PromptStatusItem, PromptStatusResponse } from "@/types/prompt";
import { validatePromptContent } from "@/utils/promptValidation";

const promptsDirectory = path.resolve(process.cwd(), "prompts");

const promptDefinitions: PromptDefinition[] = [
  {
    name: "review",
    fileName: "review.md",
    path: "prompts/review.md"
  },
  {
    name: "planner",
    fileName: "planner.md",
    path: "prompts/planner.md"
  },
  {
    name: "knowledge",
    fileName: "knowledge.md",
    path: "prompts/knowledge.md"
  }
];

export const promptService = {
  async getStatus(): Promise<PromptStatusResponse> {
    const prompts = await Promise.all(promptDefinitions.map(readPromptStatus));

    return {
      prompts
    };
  }
};

async function readPromptStatus(definition: PromptDefinition): Promise<PromptStatusItem> {
  const content = await readPromptFile(definition.fileName);
  const validation = validatePromptContent(content);

  return {
    ...definition,
    ...validation
  };
}

async function readPromptFile(fileName: string): Promise<string | null> {
  try {
    return await readFile(path.join(promptsDirectory, fileName), "utf8");
  } catch {
    return null;
  }
}

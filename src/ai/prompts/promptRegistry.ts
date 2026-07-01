import { readFile } from "node:fs/promises";
import { resolvePromptPath } from "@/ai/prompts/promptLoader";
import type { PromptCategory, RegisteredPrompt } from "@/types/ai";

const promptDefinitions: Record<string, { category: PromptCategory; version: string }> = {
  "candidate-understanding.md": { category: "candidate-understanding", version: "1.0" },
  "daily-insights.md": { category: "daily-workspace", version: "1.0" },
  "daily-summary.md": { category: "daily-workspace", version: "1.0" },
  "improvement-suggestions.md": { category: "daily-workspace", version: "1.0" },
  "interview-preparation.md": { category: "recruit-together", version: "1.0" },
  "job-understanding.md": { category: "job-understanding", version: "1.0" },
  "knowledge.md": { category: "knowledge", version: "1.0" },
  "monthly-review.md": { category: "review", version: "1.0" },
  "phone-screen-preparation.md": { category: "recruit-together", version: "1.0" },
  "planner.md": { category: "planner", version: "1.0" },
  "recruiter-summary.md": { category: "recruit-together", version: "1.0" },
  "resume-evaluation.md": { category: "resume-evaluation", version: "1.0" },
  "review.md": { category: "review", version: "1.0" },
  "spreadsheet-analysis.md": { category: "spreadsheet-analysis", version: "1.0" },
  "tomorrow-priorities.md": { category: "daily-workspace", version: "1.0" },
  "weekly-review.md": { category: "review", version: "1.0" }
};

export const promptRegistry = {
  async getPrompt(fileName: string): Promise<RegisteredPrompt> {
    const promptPath = resolvePromptPath(fileName);
    const template = await readFile(promptPath, "utf8");
    const definition = promptDefinitions[fileName] ?? {
      category: "review" satisfies PromptCategory,
      version: "1.0"
    };

    return {
      category: definition.category,
      fileName,
      path: `prompts/${fileName}`,
      template,
      version: extractPromptVersion(template) ?? definition.version
    };
  }
};

function extractPromptVersion(template: string): string | null {
  const match = template.match(/^#\s*version:\s*([^\s]+)/i);

  return match?.[1] ?? null;
}

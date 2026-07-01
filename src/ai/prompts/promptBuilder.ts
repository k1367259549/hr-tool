import { applyPromptVariables } from "@/ai/prompts/promptLoader";
import type { JsonValue, PromptMetadata, PromptVariables } from "@/types/ai";

type PromptBuilderInput = {
  template: string;
  metadata: PromptMetadata;
  variables?: PromptVariables;
  recruitingContext?: JsonValue;
  retryInstruction?: string;
};

export const promptBuilder = {
  build(input: PromptBuilderInput): string {
    const prompt = applyPromptVariables(input.template, input.variables ?? {});
    const metadataBlock = buildMetadataBlock(input.metadata);
    const recruitingContextBlock =
      input.recruitingContext === undefined
        ? ""
        : `\n\nRecruiting Context:\n${JSON.stringify(input.recruitingContext, null, 2)}`;
    const retryBlock = input.retryInstruction ? `\n\nRetry Instruction:\n${input.retryInstruction}` : "";

    return `${metadataBlock}${recruitingContextBlock}\n\n${prompt}${retryBlock}`;
  }
};

function buildMetadataBlock(metadata: PromptMetadata): string {
  return [
    "Prompt Metadata:",
    `- file: ${metadata.path}`,
    `- version: ${metadata.version}`,
    `- category: ${metadata.category}`,
    "- output: JSON only"
  ].join("\n");
}

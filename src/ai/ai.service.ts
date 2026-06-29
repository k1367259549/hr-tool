import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { loadPrompt } from "@/ai/prompts/promptLoader";
import { openAiProvider } from "@/ai/provider/openai";
import type { AiGenerateTextInput, AiPromptGenerationInput, JsonValue } from "@/types/ai";

async function generateTextFromPrompt(input: AiPromptGenerationInput): Promise<string> {
  const prompt = await loadPrompt({
    fileName: input.promptFile,
    variables: input.variables
  });

  return openAiProvider.generateText({
    prompt,
    model: input.model,
    temperature: input.temperature
  });
}

export const aiService = {
  async generateText(input: AiGenerateTextInput): Promise<string> {
    return openAiProvider.generateText(input);
  },

  async generateTextFromPrompt(input: AiPromptGenerationInput): Promise<string> {
    return generateTextFromPrompt(input);
  },

  async generateJsonFromPrompt<TJson extends JsonValue = JsonValue>(
    input: AiPromptGenerationInput
  ): Promise<TJson> {
    const output = await generateTextFromPrompt(input);

    return parseJsonOutput<TJson>(output);
  }
};

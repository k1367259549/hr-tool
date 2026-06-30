import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { loadPrompt } from "@/ai/prompts/promptLoader";
import { getAIProvider } from "@/ai/provider/factory";
import { aiConfig } from "@/config/ai.config";
import type {
  AIGenerateInput,
  AIGenerateResult,
  AiPromptGenerationInput,
  JsonValue
} from "@/types/ai";

async function generateFromPrompt(input: AiPromptGenerationInput): Promise<AIGenerateResult> {
  const prompt = await loadPrompt({
    fileName: input.promptFile,
    variables: input.variables
  });

  return generate({
    prompt,
    model: input.model,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    provider: input.provider
  });
}

async function generate(
  input: AIGenerateInput & {
    provider?: string;
  }
): Promise<AIGenerateResult> {
  const provider = getAIProvider(input.provider ?? aiConfig.defaultProvider);

  return provider.generate(input);
}

export const aiService = {
  async generate(input: AIGenerateInput & { provider?: string }): Promise<AIGenerateResult> {
    return generate(input);
  },

  async generateText(input: AIGenerateInput & { provider?: string }): Promise<string> {
    const result = await generate(input);

    return result.content;
  },

  async generateFromPrompt(input: AiPromptGenerationInput): Promise<AIGenerateResult> {
    return generateFromPrompt(input);
  },

  async generateTextFromPrompt(input: AiPromptGenerationInput): Promise<string> {
    const result = await generateFromPrompt(input);

    return result.content;
  },

  async generateJsonFromPrompt<TJson extends JsonValue = JsonValue>(
    input: AiPromptGenerationInput
  ): Promise<TJson> {
    const output = await this.generateTextFromPrompt(input);

    return parseJsonOutput<TJson>(output);
  }
};

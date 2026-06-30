import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { loadPrompt } from "@/ai/prompts/promptLoader";
import { getAIProvider } from "@/ai/provider/factory";
import { aiConfig } from "@/config/ai.config";
import type {
  AIGenerateInput,
  AIGenerateResult,
  AiErrorCode,
  AiPromptGenerationInput,
  JsonValue
} from "@/types/ai";

class AIServiceError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
  }
}

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

  return runWithRetry(() => provider.generate(input));
}

async function runWithRetry(operation: () => Promise<AIGenerateResult>): Promise<AIGenerateResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= aiConfig.maxRetries; attempt += 1) {
    try {
      return await runWithTimeout(operation(), aiConfig.timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AIServiceError("AI_PROVIDER_ERROR", "AI generation failed.");
}

async function runWithTimeout<TValue>(promise: Promise<TValue>, timeoutMs: number): Promise<TValue> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AIServiceError("AI_TIMEOUT", "AI generation timed out."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
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

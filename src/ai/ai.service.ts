import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { promptBuilder } from "@/ai/prompts/promptBuilder";
import { promptRegistry } from "@/ai/prompts/promptRegistry";
import { getAIProvider } from "@/ai/provider/factory";
import { aiConfig } from "@/config/ai.config";
import { logger } from "@/lib/logger";
import { auditService } from "@/services/audit.service";
import { AppError, getPublicErrorMessage } from "@/utils/errors";
import type {
  AIGenerateInput,
  AIGenerateResult,
  AiValidatedJsonGenerationInput,
  AiValidatedJsonGenerationResult,
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
  const registeredPrompt = await promptRegistry.getPrompt(input.promptFile);
  const prompt = promptBuilder.build({
    metadata: {
      category: input.promptCategory ?? registeredPrompt.category,
      fileName: registeredPrompt.fileName,
      path: registeredPrompt.path,
      version: registeredPrompt.version
    },
    recruitingContext: input.recruitingContext,
    template: registeredPrompt.template,
    variables: input.variables
  });

  return generate({
    feature: input.feature,
    prompt,
    model: input.model,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    timeoutMs: input.timeoutMs,
    provider: input.provider
  });
}

async function generateValidatedJsonFromPrompt<TOutput>(
  input: AiValidatedJsonGenerationInput<TOutput>
): Promise<AiValidatedJsonGenerationResult<TOutput>> {
  const registeredPrompt = await promptRegistry.getPrompt(input.promptFile);
  const promptMetadata = {
    category: input.promptCategory ?? registeredPrompt.category,
    fileName: registeredPrompt.fileName,
    path: registeredPrompt.path,
    version: registeredPrompt.version
  };
  const provider = input.provider ?? aiConfig.defaultProvider;
  const model = input.model ?? aiConfig.defaultModel;
  const feature = input.feature ?? "unknown";
  const workflow = input.workflow ?? feature;
  const startedAt = Date.now();
  let lastValidationError: unknown;

  for (let validationAttempt = 0; validationAttempt <= 1; validationAttempt += 1) {
    const prompt = promptBuilder.build({
      metadata: promptMetadata,
      recruitingContext: input.recruitingContext,
      retryInstruction: validationAttempt > 0 ? createJsonRetryInstruction(lastValidationError) : undefined,
      template: registeredPrompt.template,
      variables: input.variables
    });

    try {
      const result = await generate({
        feature,
        maxTokens: input.maxTokens,
        model,
        prompt,
        provider,
        temperature: input.temperature,
        timeoutMs: input.timeoutMs
      });
      const parsedJson = parseJsonOutput<JsonValue>(result.content);
      const output = input.validate(parsedJson);

      logger.info("AI structured output validated.", {
        feature,
        latencyMs: result.latencyMs,
        model: result.model,
        promptCategory: promptMetadata.category,
        promptPath: promptMetadata.path,
        promptVersion: promptMetadata.version,
        provider,
        providerRetryCount: result.retryCount ?? 0,
        validationResult: "success",
        validationRetryCount: validationAttempt,
        workflow
      });

      return {
        generationTimeMs: Date.now() - startedAt,
        model: result.model,
        output,
        prompt: promptMetadata,
        provider,
        providerRetryCount: result.retryCount ?? 0,
        rawOutput: result.content,
        retryCount: validationAttempt,
        validationResult: "success"
      };
    } catch (error) {
      if (error instanceof AppError) {
        logger.error("AI structured output generation failed.", {
          errorMessage: error.message,
          feature,
          model,
          promptCategory: promptMetadata.category,
          promptPath: promptMetadata.path,
          promptVersion: promptMetadata.version,
          provider,
          validationResult: "not_run",
          validationRetryCount: validationAttempt,
          workflow
        });

        throw error;
      }

      lastValidationError = error;

      logger.warn("AI structured output validation failed.", {
        errorMessage: getErrorMessage(error),
        feature,
        model,
        promptCategory: promptMetadata.category,
        promptPath: promptMetadata.path,
        promptVersion: promptMetadata.version,
        provider,
        retryRemaining: validationAttempt === 0,
        validationResult: "failed",
        validationRetryCount: validationAttempt,
        workflow
      });
    }
  }

  logger.error("AI structured output failed after retry.", {
    errorMessage: getErrorMessage(lastValidationError),
    feature,
    model,
    promptCategory: promptMetadata.category,
    promptPath: promptMetadata.path,
    promptVersion: promptMetadata.version,
    provider,
    validationResult: "failed",
    validationRetryCount: 1,
    workflow
  });

  throw new AppError("AI_ERROR", "AI output failed JSON validation.", 502);
}

async function generate(
  input: AIGenerateInput & {
    provider?: string;
  }
): Promise<AIGenerateResult> {
  const feature = input.feature ?? "unknown";
  const model = input.model ?? aiConfig.defaultModel;
  const provider = getAIProvider(input.provider ?? aiConfig.defaultProvider);
  const timeoutMs = input.timeoutMs ?? aiConfig.timeoutMs;

  try {
    const { result, retryCount } = await runWithRetry(() => provider.generate(input), timeoutMs);
    const resultWithRetryCount = {
      ...result,
      retryCount
    };

    await auditService.logAIRequest({
      feature,
      latencyMs: result.latencyMs,
      model: result.model,
      outputTokens: result.usage?.completionTokens,
      promptTokens: result.usage?.promptTokens,
      success: true,
      totalTokens: result.usage?.totalTokens
    });

    return resultWithRetryCount;
  } catch (error) {
    const errorMessage = getPublicErrorMessage(error, "AI_ERROR");

    await auditService.logAIRequest({
      errorMessage,
      feature,
      model,
      success: false
    });

    throw new AppError("AI_ERROR", errorMessage, 502);
  }
}

async function runWithRetry(
  operation: () => Promise<AIGenerateResult>,
  timeoutMs: number
): Promise<{ result: AIGenerateResult; retryCount: number }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= aiConfig.maxRetries; attempt += 1) {
    try {
      const result = await runWithTimeout(operation(), timeoutMs);

      return {
        result,
        retryCount: attempt
      };
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
      reject(new AIServiceError("AI_TIMEOUT", `AI generation timed out after ${timeoutMs} ms.`));
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
  },

  async generateValidatedJsonFromPrompt<TOutput>(
    input: AiValidatedJsonGenerationInput<TOutput>
  ): Promise<AiValidatedJsonGenerationResult<TOutput>> {
    return generateValidatedJsonFromPrompt(input);
  }
};

function createJsonRetryInstruction(error: unknown): string {
  return [
    "The previous response was not valid JSON or did not match the required schema.",
    `Validation error: ${getErrorMessage(error)}`,
    "Return only one valid JSON object matching the requested shape. Do not include markdown or explanations."
  ].join("\n");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown AI validation error.";
}

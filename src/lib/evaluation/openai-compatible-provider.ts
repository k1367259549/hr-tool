import { parseJsonOutput, JsonParserError } from "@/ai/parser/jsonParser";
import { promptRegistry } from "@/ai/prompts/promptRegistry";
import {
  adaptDetailedScreeningResultToLegacyEvaluationResult,
  resolveDetailedScreeningResult
} from "@/lib/resume-screening/detailed-screening-contract";
import { validateAndNormalizeDetailedCriterionAssessments } from "@/lib/resume-screening/detailed-criterion-contract";
import type {
  EvaluationProvider,
  EvaluationProviderInput,
  EvaluationProviderMetadata,
  EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
import { validateEvaluationProviderInput } from "@/lib/evaluation/provider-interface";
import type { EvaluationRunFailureReason } from "@/types/evaluation-run-lifecycle";

type FetchLike = (
  input: string,
  init?: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  statusText?: string;
  json(): Promise<unknown>;
}>;

type OpenAICompatibleEvaluationProviderOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  now?: () => Date;
  version?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const CHAT_COMPLETIONS_ENDPOINT = "/v1/chat/completions";
const DETAILED_ANALYSIS_PROMPT_FILE = "detailed-analysis.md";

export class OpenAICompatibleEvaluationProvider implements EvaluationProvider {
  readonly name = "OPENAI_COMPATIBLE";
  readonly version: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly model: string;
  private readonly now: () => Date;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleEvaluationProviderOptions) {
    this.assertConfig(options);

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.model = options.model;
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.version = options.version ?? "openai-compatible-skeleton-v1";
  }

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult> {
    const startedAt = this.now();

    try {
      const inputValidationError = validateProviderInput(input);

      if (inputValidationError) {
        const completedAt = this.now();
        const prompt = await promptRegistry.getPrompt(DETAILED_ANALYSIS_PROMPT_FILE);

        return this.failure(
          "VALIDATION_ERROR",
          "openai-compatible-input-invalid",
          inputValidationError,
          this.createMetadata(startedAt, completedAt, prompt)
        );
      }

      const prompt = await promptRegistry.getPrompt(DETAILED_ANALYSIS_PROMPT_FILE);
      const response = await withTimeout(
        this.fetchImpl(this.createUrl(), {
          body: JSON.stringify(this.createRequestBody(input, prompt.template)),
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        }),
        this.timeoutMs
      );
      const completedAt = this.now();
      const metadata = this.createMetadata(startedAt, completedAt, prompt);

      if (!response.ok) {
        return this.failure(
          "PROVIDER_ERROR",
          "openai-compatible-provider-response-error",
          `OpenAI-compatible provider returned HTTP ${response.status}.`,
          metadata
        );
      }

      const payload = await response.json();
      const content = getChatMessageContent(payload);

      if (typeof content !== "string") {
        return this.failure(
          "VALIDATION_ERROR",
          "openai-compatible-missing-content",
          "OpenAI-compatible response did not include message content.",
          metadata
        );
      }

      let parsedJson: unknown;

      try {
        parsedJson = parseJsonOutput(content);
      } catch (parseError) {
        return this.failure(
          "VALIDATION_ERROR",
          "openai-compatible-invalid-json",
          parseError instanceof JsonParserError
            ? parseError.message
            : "OpenAI-compatible response content must be valid JSON.",
          metadata
        );
      }

      const detailed = resolveDetailedScreeningResult(parsedJson);

      if (!detailed.success) {
        return this.failure(
          "VALIDATION_ERROR",
          `openai-compatible-${detailed.code.toLowerCase().replaceAll("_", "-")}`,
          detailed.message,
          metadata
        );
      }

      let detailedResult = detailed.result;

      if (input.analysisMode === "DETAILED") {
        if (detailed.compatibilityStatus !== "CURRENT_V2") {
          return this.failure(
            "VALIDATION_ERROR",
            "openai-compatible-detailed-contract-version-invalid",
            "OpenAI-compatible provider must return the current detailed screening V2 contract.",
            metadata
          );
        }

        if (!input.evaluationCriteria) {
          return this.failure(
            "VALIDATION_ERROR",
            "openai-compatible-evaluation-criteria-required",
            "evaluationCriteria is required for criterion-aware detailed analysis.",
            metadata
          );
        }

        if (detailedResult.schemaVersion !== "m11-a.detailed.v2") {
          return this.failure(
            "VALIDATION_ERROR",
            "openai-compatible-detailed-contract-version-invalid",
            "OpenAI-compatible provider must return the current detailed screening V2 contract.",
            metadata
          );
        }

        const criterionContract = validateAndNormalizeDetailedCriterionAssessments(
          input.evaluationCriteria,
          detailedResult
        );

        if (!criterionContract.success) {
          return this.failure(
            "VALIDATION_ERROR",
            `openai-compatible-${criterionContract.code.toLowerCase().replaceAll("_", "-")}`,
            criterionContract.message,
            metadata
          );
        }

        detailedResult = criterionContract.result;
      }

      const legacyOutput = adaptDetailedScreeningResultToLegacyEvaluationResult(
        detailedResult
      );

      return {
        success: true,
        detailedScreeningResult: detailedResult,
        output: legacyOutput,
        metadata
      };
    } catch (error) {
      const completedAt = this.now();
      const isTimeout = error instanceof Error && error.message === "Provider timeout.";

      return this.failure(
        isTimeout ? "TIMEOUT" : "PROVIDER_ERROR",
        isTimeout ? "openai-compatible-timeout" : "openai-compatible-network-error",
        sanitizeErrorMessage(
          error instanceof Error ? error.message : "OpenAI-compatible provider failed.",
          this.apiKey
        ),
        this.createMetadata(startedAt, completedAt)
      );
    }
  }

  private assertConfig(options: OpenAICompatibleEvaluationProviderOptions): void {
    if (!options.baseUrl.trim()) {
      throw new Error("OpenAI-compatible provider baseUrl is required.");
    }

    if (!options.apiKey.trim()) {
      throw new Error("OpenAI-compatible provider apiKey is required.");
    }

    if (!options.model.trim()) {
      throw new Error("OpenAI-compatible provider model is required.");
    }
  }

  private createMetadata(
    startedAt: Date,
    completedAt: Date,
    prompt?: Awaited<ReturnType<typeof promptRegistry.getPrompt>>
  ): EvaluationProviderMetadata {
    return {
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      model: this.model,
      promptFile: prompt?.path,
      promptVersion: prompt?.version,
      providerName: this.name,
      providerVersion: this.version,
      startedAt: startedAt.toISOString()
    };
  }

  private createRequestBody(input: EvaluationProviderInput, promptTemplate: string) {
    return {
      model: this.model,
      messages: [
        {
          role: "system",
          content: promptTemplate.replace(
            "{{INPUT}}",
            "The user message contains the delimited evaluation input blocks."
          )
        },
        {
          role: "user",
          content: createEvaluationInputBlock(input)
        }
      ],
      response_format: {
        type: "json_object"
      },
      temperature: 0
    };
  }

  private createUrl(): string {
    return `${this.baseUrl}${CHAT_COMPLETIONS_ENDPOINT}`;
  }

  private failure(
    failureReason: EvaluationRunFailureReason,
    code: string,
    message: string,
    metadata: EvaluationProviderMetadata
  ): EvaluationProviderResult {
    return {
      success: false,
      error: {
        code,
        message
      },
      failureReason,
      metadata
    };
  }
}

function createEvaluationInputBlock(input: EvaluationProviderInput): string {
  return [
    "<EVALUATION_CONTEXT>",
    `runId: ${input.runId}`,
    `candidateName: ${input.candidateName ?? ""}`,
    `jobTitle: ${input.jobTitle ?? ""}`,
    `candidateId: ${input.candidateId ?? ""}`,
    `jobProfileId: ${input.jobProfileId ?? ""}`,
    `templateVersionId: ${input.templateVersionId ?? ""}`,
    `evaluationTemplateVersionId: ${input.evaluationTemplateVersionId ?? ""}`,
    "</EVALUATION_CONTEXT>",
    ...createEvaluationCriteriaBlock(input),
    ...createJobUnderstandingBlock(input),
    "<JOB_DESCRIPTION>",
    input.jobDescription,
    "</JOB_DESCRIPTION>",
    "<RESUME_TEXT>",
    input.resumeText,
    "</RESUME_TEXT>"
  ].join("\n");
}

function createEvaluationCriteriaBlock(input: EvaluationProviderInput): string[] {
  if (input.analysisMode !== "DETAILED") {
    return [];
  }

  return ["<EVALUATION_CRITERIA>", JSON.stringify(input.evaluationCriteria ?? [], null, 2), "</EVALUATION_CRITERIA>"];
}

function createJobUnderstandingBlock(input: EvaluationProviderInput): string[] {
  const content = formatJobUnderstanding(input);

  if (!content) {
    return [];
  }

  return ["<JOB_UNDERSTANDING>", content, "</JOB_UNDERSTANDING>"];
}

function formatJobUnderstanding(input: EvaluationProviderInput): string | null {
  if (input.jobUnderstandingJson !== undefined) {
    return JSON.stringify(input.jobUnderstandingJson, null, 2);
  }

  const summary = input.jobUnderstandingSummary?.trim();

  return summary ? summary : null;
}

function getChatMessageContent(payload: unknown): unknown {
  const response = payload as ChatCompletionResponse;

  return response.choices?.[0]?.message?.content;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Provider timeout."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function validateProviderInput(input: EvaluationProviderInput): string | null {
  if (!input.resumeText.trim()) {
    return "resumeText is required for detailed analysis.";
  }

  if (!input.jobDescription.trim()) {
    return "jobDescription is required for detailed analysis.";
  }

  const modeError = validateEvaluationProviderInput(input);

  if (modeError === "EVALUATION_CRITERIA_REQUIRED") {
    return "evaluationCriteria is required for criterion-aware detailed analysis.";
  }

  if (modeError === "EVALUATION_CRITERIA_INVALID") {
    return "evaluationCriteria must contain unique, valid template criteria.";
  }

  if (modeError === "EVALUATION_PROVIDER_MODE_INVALID") {
    return "analysisMode must be DETAILED for the OpenAI-compatible detailed analysis provider.";
  }

  return null;
}

function sanitizeErrorMessage(message: string, apiKey: string): string {
  return apiKey ? message.replaceAll(apiKey, "[redacted]") : message;
}

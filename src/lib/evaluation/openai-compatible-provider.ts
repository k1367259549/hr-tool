import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import type {
  EvaluationProvider,
  EvaluationProviderInput,
  EvaluationProviderMetadata,
  EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
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
      const response = await withTimeout(
        this.fetchImpl(this.createUrl(), {
          body: JSON.stringify(this.createRequestBody(input)),
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        }),
        this.timeoutMs
      );
      const completedAt = this.now();
      const metadata = this.createMetadata(startedAt, completedAt);

      if (!response.ok) {
        return this.failure(
          "PROVIDER_ERROR",
          "openai-compatible-http-error",
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

      const parsed = parseJsonContent(content);

      if (!parsed.success) {
        return this.failure(
          "VALIDATION_ERROR",
          "openai-compatible-json-parse-failed",
          parsed.error,
          metadata
        );
      }

      const bound = bindEvaluationRunOutput(parsed.value);

      if (!bound.success) {
        return this.failure(
          "VALIDATION_ERROR",
          "openai-compatible-output-binding-failed",
          bound.error,
          metadata
        );
      }

      return {
        success: true,
        output: bound.output,
        metadata
      };
    } catch (error) {
      const completedAt = this.now();
      const isTimeout = error instanceof Error && error.message === "Provider timeout.";

      return this.failure(
        isTimeout ? "TIMEOUT" : "PROVIDER_ERROR",
        isTimeout ? "openai-compatible-timeout" : "openai-compatible-network-error",
        error instanceof Error ? error.message : "OpenAI-compatible provider failed.",
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
    completedAt: Date
  ): EvaluationProviderMetadata {
    return {
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      model: this.model,
      providerName: this.name,
      providerVersion: this.version,
      startedAt: startedAt.toISOString()
    };
  }

  private createRequestBody(input: EvaluationProviderInput) {
    return {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Return only JSON that conforms to the resume evaluation output schema. Do not make hiring decisions."
        },
        {
          role: "user",
          content: JSON.stringify({
            jobDescription: input.jobDescription,
            resumeText: input.resumeText,
            runId: input.runId,
            candidateId: input.candidateId ?? null,
            jobProfileId: input.jobProfileId ?? null,
            templateVersionId: input.templateVersionId ?? null
          })
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

function getChatMessageContent(payload: unknown): unknown {
  const response = payload as ChatCompletionResponse;

  return response.choices?.[0]?.message?.content;
}

function parseJsonContent(
  content: string
): { success: true; value: unknown } | { success: false; error: string } {
  try {
    return {
      success: true,
      value: JSON.parse(content)
    };
  } catch {
    return {
      success: false,
      error: "OpenAI-compatible response content must be valid JSON."
    };
  }
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

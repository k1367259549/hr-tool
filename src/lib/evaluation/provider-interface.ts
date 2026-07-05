import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type {
  EvaluationRunFailureReason,
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

export const evaluationProviderNames = [
  "MOCK",
  "RULE_BASED",
  "OPENAI_COMPATIBLE",
  "LUMINAI",
  "GPT_5_5"
] as const;

export type EvaluationProviderName = (typeof evaluationProviderNames)[number];

export type EvaluationProviderInput = {
  runId: string;
  resumeText: string;
  jobDescription: string;
  candidateName?: string;
  jobTitle?: string;
  candidateId?: string;
  jobProfileId?: string;
  templateVersionId?: string;
  lifecycleSnapshot?: EvaluationRunLifecycleSnapshot;
};

export type EvaluationProviderMetadata = {
  providerName: EvaluationProviderName;
  providerVersion: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  model?: string;
};

export type EvaluationProviderError = {
  message: string;
  code: string | null;
};

export type EvaluationProviderResult =
  | {
      success: true;
      output: ResumeEvaluationResult;
      metadata: EvaluationProviderMetadata;
    }
  | {
      success: false;
      error: EvaluationProviderError;
      failureReason: EvaluationRunFailureReason;
      metadata: EvaluationProviderMetadata;
    };

export interface EvaluationProvider {
  name: EvaluationProviderName;
  version: string;
  evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult>;
}

type MockEvaluationProviderOptions = {
  version?: string;
  shouldFail?: boolean;
  output?: unknown;
  error?: EvaluationProviderError;
  failureReason?: EvaluationRunFailureReason;
  now?: () => Date;
};

export class MockEvaluationProvider implements EvaluationProvider {
  readonly name = "MOCK";
  readonly version: string;
  private readonly error: EvaluationProviderError;
  private readonly failureReason: EvaluationRunFailureReason;
  private readonly now: () => Date;
  private readonly output: unknown;
  private readonly shouldFail: boolean;

  constructor(options: MockEvaluationProviderOptions = {}) {
    this.error = options.error ?? {
      code: "mock-provider-failed",
      message: "Mock evaluation provider failed."
    };
    this.failureReason = options.failureReason ?? "UNKNOWN";
    this.now = options.now ?? (() => new Date());
    this.output = options.output ?? createMockEvaluationOutput();
    this.shouldFail = options.shouldFail ?? false;
    this.version = options.version ?? "mock-v1";
  }

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult> {
    void input;

    const startedAt = this.now();

    if (this.shouldFail) {
      return {
        success: false,
        error: this.error,
        failureReason: this.failureReason,
        metadata: this.createMetadata(startedAt, this.now())
      };
    }

    const bound = bindEvaluationRunOutput(this.output);
    const completedAt = this.now();

    if (!bound.success) {
      return {
        success: false,
        error: {
          code: "mock-output-validation-failed",
          message: bound.error
        },
        failureReason: "VALIDATION_ERROR",
        metadata: this.createMetadata(startedAt, completedAt)
      };
    }

    return {
      success: true,
      output: bound.output,
      metadata: this.createMetadata(startedAt, completedAt)
    };
  }

  private createMetadata(
    startedAt: Date,
    completedAt: Date
  ): EvaluationProviderMetadata {
    return {
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      providerName: this.name,
      providerVersion: this.version,
      startedAt: startedAt.toISOString()
    };
  }
}

function createMockEvaluationOutput(): ResumeEvaluationResult {
  return {
    confidence: "MEDIUM",
    dimensionScores: [
      {
        evidenceIds: ["ev_mock_relevant_experience"],
        key: "relevant-experience",
        label: "Relevant Experience",
        rationale: "Mock evaluation found resume evidence that maps to the role.",
        score: 72
      }
    ],
    evidence: [
      {
        id: "ev_mock_relevant_experience",
        relevance: "MEDIUM",
        source: "RESUME",
        text: "Mock evidence: candidate has experience related to the job."
      }
    ],
    interviewQuestions: [
      {
        category: "EXPERIENCE",
        evidenceIds: ["ev_mock_relevant_experience"],
        purpose: "Validate the depth of the relevant experience.",
        question: "Which relevant project best demonstrates this experience?"
      }
    ],
    notes: null,
    overallScore: 72,
    overallSummary:
      "Mock evaluation output for exercising the provider interface contract.",
    recommendation: "POTENTIAL_FIT",
    risks: [],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description: "The mock output includes one relevant resume signal.",
        evidenceIds: ["ev_mock_relevant_experience"],
        title: "Relevant signal"
      }
    ],
    weaknesses: []
  };
}

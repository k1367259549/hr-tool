import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import type {
  EvaluationProvider,
  EvaluationProviderInput,
  EvaluationProviderMetadata,
  EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
import {
  adaptQuickScreeningResultToLegacyEvaluationResult,
  createRuleBasedQuickScreeningResult
} from "@/lib/resume-screening/rule-based-quick-screening-engine";

type RuleBasedEvaluationProviderOptions = {
  version?: string;
  now?: () => Date;
};

export class RuleBasedEvaluationProvider implements EvaluationProvider {
  readonly name = "RULE_BASED";
  readonly version: string;
  private readonly now: () => Date;

  constructor(options: RuleBasedEvaluationProviderOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.version = options.version ?? "0.1.0";
  }

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult> {
    const startedAt = this.now();

    try {
      const quickScreeningResult = createRuleBasedQuickScreeningResult(input);
      const legacyOutput =
        adaptQuickScreeningResultToLegacyEvaluationResult(quickScreeningResult);
      const bound = bindEvaluationRunOutput(legacyOutput);
      const completedAt = this.now();

      if (!bound.success) {
        return {
          success: false,
          error: {
            code: "rule-based-output-validation-failed",
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
    } catch (error) {
      const completedAt = this.now();

      return {
        success: false,
        error: {
          code: "rule-based-quick-screening-failed",
          message:
            error instanceof Error
              ? error.message
              : "Rule-based quick screening failed."
        },
        failureReason: "VALIDATION_ERROR",
        metadata: this.createMetadata(startedAt, completedAt)
      };
    }
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

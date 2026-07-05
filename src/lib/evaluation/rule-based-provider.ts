import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import type {
  EvaluationProvider,
  EvaluationProviderInput,
  EvaluationProviderMetadata,
  EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

const MIN_TEXT_LENGTH = 20;
const MAX_KEYWORDS = 12;
const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "build",
  "can",
  "for",
  "from",
  "has",
  "have",
  "into",
  "job",
  "maintain",
  "must",
  "our",
  "role",
  "that",
  "the",
  "their",
  "this",
  "with",
  "work",
  "will",
  "you"
]);

type RuleBasedEvaluationProviderOptions = {
  version?: string;
  now?: () => Date;
};

type KeywordAnalysis = {
  keywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
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
    const validationError = validateInputText(input);

    if (validationError) {
      return {
        success: false,
        error: {
          code: "rule-based-input-validation-failed",
          message: validationError
        },
        failureReason: "VALIDATION_ERROR",
        metadata: this.createMetadata(startedAt, this.now())
      };
    }

    const analysis = analyzeKeywords(input.jobDescription, input.resumeText);
    const output = createRuleBasedOutput(analysis);
    const bound = bindEvaluationRunOutput(output);
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

function validateInputText(input: EvaluationProviderInput): string | null {
  if (input.resumeText.trim().length < MIN_TEXT_LENGTH) {
    return "resumeText must contain enough text for rule-based evaluation.";
  }

  if (input.jobDescription.trim().length < MIN_TEXT_LENGTH) {
    return "jobDescription must contain enough text for rule-based evaluation.";
  }

  return null;
}

function analyzeKeywords(jobDescription: string, resumeText: string): KeywordAnalysis {
  const keywords = extractKeywords(jobDescription);
  const normalizedResume = normalizeText(resumeText);
  const matchedKeywords = keywords.filter((keyword) =>
    normalizedResume.includes(keyword)
  );
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const score =
    keywords.length === 0
      ? 0
      : Math.round((matchedKeywords.length / keywords.length) * 100);

  return {
    keywords,
    matchedKeywords,
    missingKeywords,
    score
  };
}

function extractKeywords(text: string): string[] {
  const tokens = normalizeText(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of tokens) {
    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    keywords.push(token);

    if (keywords.length >= MAX_KEYWORDS) {
      break;
    }
  }

  return keywords;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createRuleBasedOutput(analysis: KeywordAnalysis): ResumeEvaluationResult {
  const matchedText = formatKeywords(analysis.matchedKeywords);
  const missingText = formatKeywords(analysis.missingKeywords);
  const matchedEvidenceId = "ev_rule_keyword_match";
  const missingEvidenceId = "ev_rule_keyword_gap";

  return {
    confidence: getConfidence(analysis.score),
    dimensionScores: [
      {
        evidenceIds: [matchedEvidenceId],
        key: "keyword-match",
        label: "Keyword Match",
        rationale:
          "Rule-based signal calculated from simple keyword overlap between the job description and resume text.",
        score: analysis.score
      }
    ],
    evidence: [
      {
        id: matchedEvidenceId,
        relevance: analysis.matchedKeywords.length > 0 ? "HIGH" : "LOW",
        source: "RESUME",
        text:
          analysis.matchedKeywords.length > 0
            ? `Resume matched these job-description keywords: ${matchedText}.`
            : "Resume did not clearly match the extracted job-description keywords."
      },
      {
        id: missingEvidenceId,
        relevance: analysis.missingKeywords.length > 0 ? "MEDIUM" : "LOW",
        source: "JOB_PROFILE",
        text:
          analysis.missingKeywords.length > 0
            ? `Job-description keywords not clearly found in the resume: ${missingText}.`
            : "No major extracted job-description keywords were missing from the resume."
      }
    ],
    interviewQuestions: [
      {
        category: "EXPERIENCE",
        evidenceIds: [matchedEvidenceId],
        purpose:
          "Validate whether the keyword overlap reflects real project experience.",
        question:
          "Which project best demonstrates the matched experience, and what was your direct contribution?"
      },
      {
        category: "RISK_FOLLOW_UP",
        evidenceIds: [missingEvidenceId],
        purpose: "Clarify gaps detected by the local rule-based signal.",
        question:
          "Can you describe any experience related to the missing job-description keywords?"
      }
    ],
    notes:
      "This is a local rule-based signal for demo and fallback use. It is not a hiring decision.",
    overallScore: analysis.score,
    overallSummary: createSummary(analysis),
    recommendation: getRecommendation(analysis.score),
    risks:
      analysis.missingKeywords.length > 0
        ? [
            {
              description:
                "Some job-description keywords were not clearly present in the resume text.",
              evidenceIds: [missingEvidenceId],
              severity: analysis.score < 35 ? "HIGH" : "MEDIUM",
              type: "MISSING_REQUIREMENT"
            }
          ]
        : [],
    schemaVersion: "m07-b3-a.v1",
    strengths:
      analysis.matchedKeywords.length > 0
        ? [
            {
              description: `Matched local rule-based keywords: ${matchedText}.`,
              evidenceIds: [matchedEvidenceId],
              title: "Keyword evidence present"
            }
          ]
        : [],
    weaknesses:
      analysis.missingKeywords.length > 0
        ? [
            {
              description: `Missing or unclear local rule-based keywords: ${missingText}.`,
              evidenceIds: [missingEvidenceId],
              severity: analysis.score < 35 ? "HIGH" : "MEDIUM",
              title: "Keyword gaps"
            }
          ]
        : []
  };
}

function createSummary(analysis: KeywordAnalysis): string {
  return `Rule-based signal only: ${analysis.matchedKeywords.length} of ${analysis.keywords.length} extracted job-description keywords were found in the resume. This score is for fallback evaluation support and is not an offer, rejection, ranking, or automatic hiring decision.`;
}

function formatKeywords(keywords: string[]): string {
  return keywords.length > 0 ? keywords.join(", ") : "none";
}

function getConfidence(score: number): ResumeEvaluationResult["confidence"] {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 35) {
    return "MEDIUM";
  }

  return "LOW";
}

function getRecommendation(
  score: number
): ResumeEvaluationResult["recommendation"] {
  if (score >= 70) {
    return "POTENTIAL_FIT";
  }

  if (score >= 35) {
    return "UNCERTAIN";
  }

  return "NOT_ENOUGH_EVIDENCE";
}

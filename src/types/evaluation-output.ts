export const evaluationRecommendations = [
  "STRONG_FIT",
  "POTENTIAL_FIT",
  "UNCERTAIN",
  "NOT_ENOUGH_EVIDENCE"
] as const;

export const evaluationConfidenceLevels = ["LOW", "MEDIUM", "HIGH"] as const;

export const evaluationEvidenceSources = [
  "RESUME",
  "JOB_PROFILE",
  "EVALUATION_CRITERIA"
] as const;

export const evaluationEvidenceRelevanceLevels = ["LOW", "MEDIUM", "HIGH"] as const;

export const evaluationSeverityLevels = ["LOW", "MEDIUM", "HIGH"] as const;

export const evaluationRiskTypes = [
  "MISSING_REQUIREMENT",
  "INCONSISTENT_EVIDENCE",
  "ROLE_MISMATCH",
  "SENIORITY_MISMATCH",
  "OTHER"
] as const;

export const evaluationInterviewQuestionCategories = [
  "TECHNICAL",
  "EXPERIENCE",
  "MOTIVATION",
  "RISK_FOLLOW_UP",
  "OTHER"
] as const;

export type EvaluationRecommendation = (typeof evaluationRecommendations)[number];

export type EvaluationConfidenceLevel = (typeof evaluationConfidenceLevels)[number];

export type EvaluationEvidenceSource = (typeof evaluationEvidenceSources)[number];

export type EvaluationEvidenceRelevance =
  (typeof evaluationEvidenceRelevanceLevels)[number];

export type EvaluationSeverity = (typeof evaluationSeverityLevels)[number];

export type EvaluationRiskType = (typeof evaluationRiskTypes)[number];

export type EvaluationInterviewQuestionCategory =
  (typeof evaluationInterviewQuestionCategories)[number];

export type DimensionScore = {
  key: string;
  label: string;
  score: number;
  rationale: string;
  evidenceIds: string[];
};

export type Evidence = {
  id: string;
  source: EvaluationEvidenceSource;
  text: string;
  relevance: EvaluationEvidenceRelevance;
};

export type Strength = {
  title: string;
  description: string;
  evidenceIds: string[];
};

export type Weakness = {
  title: string;
  description: string;
  severity: EvaluationSeverity;
  evidenceIds: string[];
};

export type Risk = {
  type: EvaluationRiskType;
  severity: EvaluationSeverity;
  description: string;
  evidenceIds: string[];
};

export type InterviewQuestion = {
  question: string;
  purpose: string;
  category: EvaluationInterviewQuestionCategory;
  evidenceIds: string[];
};

export type ResumeEvaluationResult = {
  schemaVersion: "m07-b3-a.v1";
  recommendation: EvaluationRecommendation;
  confidence: EvaluationConfidenceLevel;
  overallScore: number;
  overallSummary: string;
  dimensionScores: DimensionScore[];
  evidence: Evidence[];
  strengths: Strength[];
  weaknesses: Weakness[];
  risks: Risk[];
  interviewQuestions: InterviewQuestion[];
  notes: string | null;
};

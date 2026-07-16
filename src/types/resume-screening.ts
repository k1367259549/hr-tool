export const screeningModes = ["QUICK", "DETAILED"] as const;

export const screeningRecommendationValues = [
  "PROCEED_TO_NEXT_STEP",
  "MANUAL_REVIEW",
  "DO_NOT_PROCEED",
  "NOT_ENOUGH_EVIDENCE"
] as const;

export const screeningTriStateValues = ["yes", "no", "unclear"] as const;

export const screeningPriorityValues = ["A", "B", "C", "D"] as const;

export const robotArmRelevanceValues = [
  "high",
  "medium",
  "low",
  "unclear"
] as const;

export const duplicateMatchStatusValues = [
  "exact_match",
  "possible_match",
  "no_match"
] as const;

export const screeningRiskSeverityValues = ["low", "medium", "high"] as const;

export const screeningEvidenceSourceValues = [
  "RESUME",
  "JOB_REQUIREMENT",
  "MISSING_INFORMATION"
] as const;

export const screeningDimensionKeyValues = [
  "education",
  "job_match",
  "robot_arm_relevance",
  "company_background",
  "experience_quality",
  "core_capability",
  "risk_control"
] as const;

export type ScreeningMode = (typeof screeningModes)[number];

export type ScreeningRecommendation =
  (typeof screeningRecommendationValues)[number];

export type ScreeningTriState = (typeof screeningTriStateValues)[number];

export type ScreeningPriority = (typeof screeningPriorityValues)[number];

export type RobotArmRelevance = (typeof robotArmRelevanceValues)[number];

export type DuplicateMatchStatus = (typeof duplicateMatchStatusValues)[number];

export type ScreeningRiskSeverity = (typeof screeningRiskSeverityValues)[number];

export type ScreeningEvidenceSource =
  (typeof screeningEvidenceSourceValues)[number];

export type ScreeningDimensionKey = (typeof screeningDimensionKeyValues)[number];

export type ScreeningEducationInfo = {
  highestDegree: string | null;
  school: string | null;
  major: string | null;
  graduationYear: number | null;
  educationPass: ScreeningTriState;
  fullTimeBachelor: ScreeningTriState;
};

export type ScreeningJobSeekingStatus = {
  currentStatus: string | null;
  expectedRole: string | null;
  expectedLocation: string | null;
  availability: string | null;
};

export type ScreeningCompanyBackground = {
  currentCompany: string | null;
  notableCompanies: string[];
  industryRelevance: RobotArmRelevance;
  notes: string | null;
};

export type ScreeningExperienceQuality = {
  yearsOfExperience: number | null;
  relevantProjects: string[];
  ownershipSignals: string[];
  qualityNotes: string | null;
};

export type ScreeningCoreCapability = {
  name: string;
  evidence: string;
  level: RobotArmRelevance;
};

export type ScreeningRisk = {
  title: string;
  severity: ScreeningRiskSeverity;
  description: string;
};

export type ScreeningOutputSuggestion = {
  recommendation: ScreeningRecommendation;
  nextStep: string;
  notes: string | null;
};

export type ResumeScreeningProfile = {
  schemaVersion: "m11-a.profile.v1";
  candidateName: string | null;
  phone: string | null;
  email: string | null;
  targetJobTitle: string;
  resumeSource: string | null;
  education: ScreeningEducationInfo;
  jobSeekingStatus: ScreeningJobSeekingStatus;
  jobMatch: {
    targetRoleMatch: RobotArmRelevance;
    robotArmRelevance: RobotArmRelevance;
    matchedKeywords: string[];
    missingKeywords: string[];
  };
  companyBackground: ScreeningCompanyBackground;
  experienceQuality: ScreeningExperienceQuality;
  coreCapabilities: ScreeningCoreCapability[];
  risks: ScreeningRisk[];
  outputSuggestion: ScreeningOutputSuggestion;
};

export type ScreeningEvidence = {
  id: string;
  source: ScreeningEvidenceSource;
  text: string;
  relatedRequirement: string | null;
};

export type ScreeningDimensionResult = {
  key: ScreeningDimensionKey;
  name: string;
  score: number;
  matchLevel: RobotArmRelevance;
  conclusion: string;
  evidence: ScreeningEvidence[];
  risks: string[];
  missingInformation: string[];
};

export type BaseScreeningResult = {
  screeningMode: ScreeningMode;
  recommendation: ScreeningRecommendation;
  overallScore: number;
  summary: string;
  dimensions: ScreeningDimensionResult[];
  strengths: string[];
  risks: ScreeningRisk[];
  missingInformation: string[];
  evidence: ScreeningEvidence[];
  interviewQuestions: string[];
  notes: string | null;
};

export type QuickScreeningResult = BaseScreeningResult & {
  schemaVersion: "m11-a.quick.v1";
  screeningMode: "QUICK";
  priority: ScreeningPriority;
  educationPass: ScreeningTriState;
  fullTimeBachelor: ScreeningTriState;
  robotArmRelevance: RobotArmRelevance;
  shouldEnterDetailedAnalysis: "yes" | "no" | "manual_review";
  mainRisk: string;
  reasons: string[];
  nextStep: string;
};

export type DetailedScreeningResultV1 = BaseScreeningResult & {
  schemaVersion: "m11-a.detailed.v1";
  screeningMode: "DETAILED";
  weaknesses: string[];
  nextStep: string;
};

export type DetailedCriterionAssessment = {
  criterionKey: string;
  criterionLabel: string;
  score: number;
  conclusion: string;
  evidence: ScreeningEvidence[];
  risks: string[];
  missingInformation: string[];
  interviewQuestions: string[];
};

export type DetailedScreeningResultV2 = BaseScreeningResult & {
  contractVersion: "detailed-screening.v2";
  criterionAssessments: DetailedCriterionAssessment[];
  schemaVersion: "m11-a.detailed.v2";
  screeningMode: "DETAILED";
  weaknesses: string[];
  nextStep: string;
};

export type DetailedScreeningResult = DetailedScreeningResultV1;

export type AnyDetailedScreeningResult = DetailedScreeningResultV1 | DetailedScreeningResultV2;

export type DuplicateCheckResult = {
  schemaVersion: "m11-a.duplicate.v1";
  status: DuplicateMatchStatus;
  confidence: number;
  matchedResumeIds: string[];
  matchedCandidateNames: string[];
  reasons: string[];
};

export type FeishuScreeningSummary = {
  schemaVersion: "m11-a.feishu-summary.v1";
  candidateName: string;
  targetJobTitle: string;
  priority: ScreeningPriority;
  recommendation: ScreeningRecommendation;
  overallScore: number | null;
  duplicateStatus: DuplicateMatchStatus;
  mainRisk: string;
  strengths: string[];
  risks: string[];
  missingInformation: string[];
  nextStep: string;
  copyableText: string;
};

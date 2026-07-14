import { z } from "zod";
import {
  duplicateMatchStatusValues,
  robotArmRelevanceValues,
  screeningDimensionKeyValues,
  screeningEvidenceSourceValues,
  screeningModes,
  screeningPriorityValues,
  screeningRecommendationValues,
  screeningRiskSeverityValues,
  screeningTriStateValues
} from "@/types/resume-screening";

const boundedText = (field: string, maxLength: number) =>
  z
    .string({
      required_error: `${field} is required.`
    })
    .trim()
    .min(1, `${field} cannot be empty.`)
    .max(maxLength, `${field} cannot exceed ${maxLength} characters.`);

const nullableText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable();

const textList = (field: string, maxItems: number, maxLength: number) =>
  z.array(boundedText(field, maxLength)).max(maxItems);

const percentageScore = z.number().finite().int().min(0).max(100);

const evidenceId = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: "evidence id must be a stable identifier."
  });

export const ScreeningModeSchema = z.enum(screeningModes);

export const ScreeningRecommendationSchema = z.enum(screeningRecommendationValues);

export const ScreeningEvidenceSchema = z
  .object({
    id: evidenceId,
    relatedRequirement: nullableText(500),
    source: z.enum(screeningEvidenceSourceValues),
    text: boundedText("text", 1500)
  })
  .strict();

export const ScreeningRiskSchema = z
  .object({
    description: boundedText("description", 1000),
    severity: z.enum(screeningRiskSeverityValues),
    title: boundedText("title", 120)
  })
  .strict();

export const ScreeningDimensionResultSchema = z
  .object({
    conclusion: boundedText("conclusion", 1000),
    evidence: z.array(ScreeningEvidenceSchema).min(1).max(30),
    key: z.enum(screeningDimensionKeyValues),
    matchLevel: z.enum(robotArmRelevanceValues),
    missingInformation: textList("missingInformation", 20, 500),
    name: boundedText("name", 120),
    risks: textList("risks", 20, 500),
    score: percentageScore
  })
  .strict();

export const ScreeningEducationInfoSchema = z
  .object({
    educationPass: z.enum(screeningTriStateValues),
    fullTimeBachelor: z.enum(screeningTriStateValues),
    graduationYear: z.number().finite().int().min(1900).max(2100).nullable(),
    highestDegree: nullableText(120),
    major: nullableText(120),
    school: nullableText(160)
  })
  .strict();

export const ScreeningJobSeekingStatusSchema = z
  .object({
    availability: nullableText(160),
    currentStatus: nullableText(160),
    expectedLocation: nullableText(160),
    expectedRole: nullableText(160)
  })
  .strict();

export const ScreeningCompanyBackgroundSchema = z
  .object({
    currentCompany: nullableText(160),
    industryRelevance: z.enum(robotArmRelevanceValues),
    notableCompanies: textList("notableCompanies", 20, 160),
    notes: nullableText(1000)
  })
  .strict();

export const ScreeningExperienceQualitySchema = z
  .object({
    ownershipSignals: textList("ownershipSignals", 20, 300),
    qualityNotes: nullableText(1000),
    relevantProjects: textList("relevantProjects", 20, 300),
    yearsOfExperience: z.number().finite().min(0).max(80).nullable()
  })
  .strict();

export const ScreeningCoreCapabilitySchema = z
  .object({
    evidence: boundedText("evidence", 500),
    level: z.enum(robotArmRelevanceValues),
    name: boundedText("name", 120)
  })
  .strict();

export const ScreeningOutputSuggestionSchema = z
  .object({
    nextStep: boundedText("nextStep", 500),
    notes: nullableText(1000),
    recommendation: ScreeningRecommendationSchema
  })
  .strict();

export const ResumeScreeningProfileSchema = z
  .object({
    candidateName: nullableText(160),
    companyBackground: ScreeningCompanyBackgroundSchema,
    coreCapabilities: z.array(ScreeningCoreCapabilitySchema).max(30).default([]),
    education: ScreeningEducationInfoSchema,
    email: nullableText(240),
    experienceQuality: ScreeningExperienceQualitySchema,
    jobMatch: z
      .object({
        matchedKeywords: textList("matchedKeywords", 50, 120).default([]),
        missingKeywords: textList("missingKeywords", 50, 120).default([]),
        robotArmRelevance: z.enum(robotArmRelevanceValues),
        targetRoleMatch: z.enum(robotArmRelevanceValues)
      })
      .strict(),
    jobSeekingStatus: ScreeningJobSeekingStatusSchema,
    outputSuggestion: ScreeningOutputSuggestionSchema,
    phone: nullableText(80),
    resumeSource: nullableText(120),
    risks: z.array(ScreeningRiskSchema).max(30).default([]),
    schemaVersion: z.literal("m11-a.profile.v1"),
    targetJobTitle: boundedText("targetJobTitle", 160)
  })
  .strict();

const BaseScreeningResultSchema = z
  .object({
    dimensions: z.array(ScreeningDimensionResultSchema).min(1).max(20),
    evidence: z.array(ScreeningEvidenceSchema).min(1).max(100),
    interviewQuestions: textList("interviewQuestions", 30, 500).default([]),
    missingInformation: textList("missingInformation", 30, 500).default([]),
    notes: nullableText(2000),
    overallScore: percentageScore,
    recommendation: ScreeningRecommendationSchema,
    risks: z.array(ScreeningRiskSchema).max(30).default([]),
    screeningMode: ScreeningModeSchema,
    strengths: textList("strengths", 30, 500).default([]),
    summary: boundedText("summary", 2000)
  })
  .strict();

export const QuickScreeningResultSchema = BaseScreeningResultSchema.extend({
  educationPass: z.enum(screeningTriStateValues),
  fullTimeBachelor: z.enum(screeningTriStateValues),
  mainRisk: boundedText("mainRisk", 500),
  nextStep: boundedText("nextStep", 500),
  priority: z.enum(screeningPriorityValues),
  reasons: textList("reasons", 20, 500).min(1),
  robotArmRelevance: z.enum(robotArmRelevanceValues),
  schemaVersion: z.literal("m11-a.quick.v1"),
  screeningMode: z.literal("QUICK"),
  shouldEnterDetailedAnalysis: z.enum(["yes", "no", "manual_review"])
}).strict();

export const DetailedScreeningResultSchema = BaseScreeningResultSchema.extend({
  nextStep: boundedText("nextStep", 500),
  schemaVersion: z.literal("m11-a.detailed.v1"),
  screeningMode: z.literal("DETAILED"),
  weaknesses: textList("weaknesses", 30, 500).default([])
}).strict();

export const DuplicateCheckResultSchema = z
  .object({
    confidence: percentageScore,
    matchedCandidateNames: textList("matchedCandidateNames", 20, 160).default([]),
    matchedResumeIds: textList("matchedResumeIds", 20, 120).default([]),
    reasons: textList("reasons", 20, 500).default([]),
    schemaVersion: z.literal("m11-a.duplicate.v1"),
    status: z.enum(duplicateMatchStatusValues)
  })
  .strict();

export const FeishuScreeningSummarySchema = z
  .object({
    candidateName: boundedText("candidateName", 160),
    copyableText: boundedText("copyableText", 5000),
    duplicateStatus: z.enum(duplicateMatchStatusValues),
    mainRisk: boundedText("mainRisk", 500),
    missingInformation: textList("missingInformation", 30, 500).default([]),
    nextStep: boundedText("nextStep", 500),
    overallScore: percentageScore.nullable(),
    priority: z.enum(screeningPriorityValues),
    recommendation: ScreeningRecommendationSchema,
    risks: textList("risks", 30, 500).default([]),
    schemaVersion: z.literal("m11-a.feishu-summary.v1"),
    strengths: textList("strengths", 30, 500).default([]),
    targetJobTitle: boundedText("targetJobTitle", 160)
  })
  .strict();

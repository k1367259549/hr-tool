import { z } from "zod";
import {
  evaluationConfidenceLevels,
  evaluationEvidenceRelevanceLevels,
  evaluationEvidenceSources,
  evaluationInterviewQuestionCategories,
  evaluationRecommendations,
  evaluationRiskTypes,
  evaluationSeverityLevels
} from "@/types/evaluation-output";

const boundedText = (field: string, maxLength: number) =>
  z
    .string({
      required_error: `${field} is required.`
    })
    .trim()
    .min(1, `${field} cannot be empty.`)
    .max(maxLength, `${field} cannot exceed ${maxLength} characters.`);

const stableKey = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, {
    message: "key must be a stable slug."
  });

const evidenceId = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: "evidenceIds must contain stable ids."
  });

const score = z.number().int().min(0).max(100);

export const DimensionScoreSchema = z
  .object({
    key: stableKey,
    label: boundedText("label", 120),
    score,
    rationale: boundedText("rationale", 1000),
    evidenceIds: z.array(evidenceId).min(1).max(20)
  })
  .strict();

export const EvidenceSchema = z
  .object({
    id: evidenceId,
    source: z.enum(evaluationEvidenceSources),
    text: boundedText("text", 2000),
    relevance: z.enum(evaluationEvidenceRelevanceLevels)
  })
  .strict();

export const StrengthSchema = z
  .object({
    title: boundedText("title", 120),
    description: boundedText("description", 1000),
    evidenceIds: z.array(evidenceId).min(1).max(20)
  })
  .strict();

export const WeaknessSchema = z
  .object({
    title: boundedText("title", 120),
    description: boundedText("description", 1000),
    severity: z.enum(evaluationSeverityLevels),
    evidenceIds: z.array(evidenceId).min(1).max(20)
  })
  .strict();

export const RiskSchema = z
  .object({
    type: z.enum(evaluationRiskTypes),
    severity: z.enum(evaluationSeverityLevels),
    description: boundedText("description", 1000),
    evidenceIds: z.array(evidenceId).min(1).max(20)
  })
  .strict();

export const InterviewQuestionSchema = z
  .object({
    question: boundedText("question", 500),
    purpose: boundedText("purpose", 500),
    category: z.enum(evaluationInterviewQuestionCategories),
    evidenceIds: z.array(evidenceId).min(1).max(20)
  })
  .strict();

export const ResumeEvaluationSchema = z
  .object({
    schemaVersion: z.literal("m07-b3-a.v1"),
    recommendation: z.enum(evaluationRecommendations),
    confidence: z.enum(evaluationConfidenceLevels),
    overallScore: score,
    overallSummary: boundedText("overallSummary", 2000),
    dimensionScores: z.array(DimensionScoreSchema).min(1).max(20),
    evidence: z.array(EvidenceSchema).min(1).max(100),
    strengths: z.array(StrengthSchema).min(0).max(20),
    weaknesses: z.array(WeaknessSchema).min(0).max(20),
    risks: z.array(RiskSchema).min(0).max(20),
    interviewQuestions: z.array(InterviewQuestionSchema).min(1).max(20),
    notes: z.string().trim().max(2000).nullable()
  })
  .strict();

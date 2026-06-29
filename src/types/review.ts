import type { Prisma } from "@prisma/client";
import type { RecruitLogDateInput } from "@/types/log";

export type DailyReview = {
  id: string;
  logId: string;
  summary: string;
  strengths: Prisma.JsonValue;
  weaknesses: Prisma.JsonValue;
  suggestions: Prisma.JsonValue;
  score: number;
  provider: string;
  model: string;
  promptFile: string;
  promptVersion: string;
  inputHash: string;
  rawOutput: Prisma.JsonValue;
  parsedOutput: Prisma.JsonValue;
  createdAt: Date;
};

export type DailyReviewDto = Omit<DailyReview, "createdAt"> & {
  createdAt: string;
};

export type ReviewAiOutput = {
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  score: number;
};

export type ReviewGenerateInput = {
  date: RecruitLogDateInput;
};

export type ReviewGeneratePayload = {
  date: string;
};

export type DailyReviewRepositoryUpsertInput = {
  logId: string;
  summary: string;
  strengths: Prisma.InputJsonValue;
  weaknesses: Prisma.InputJsonValue;
  suggestions: Prisma.InputJsonValue;
  score: number;
  provider: string;
  model: string;
  promptFile: string;
  promptVersion: string;
  inputHash: string;
  rawOutput: Prisma.InputJsonValue;
  parsedOutput: Prisma.InputJsonValue;
};

export type ReviewResultView = {
  id: string;
  dateLabel: string;
  generatedAtLabel: string;
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  score: number;
  scoreLabel: string;
  scoreTone: "success" | "warning" | "danger";
  modelLabel: string;
};

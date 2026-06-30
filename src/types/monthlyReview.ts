import type { DashboardKpiSummary } from "@/types/dashboard";

export type MonthlyReviewAiOutput = {
  summary: string;
  keyMetrics: string;
  majorAchievements: string;
  mainProblems: string;
  suggestions: string;
  nextMonthFocus: string;
  score: number;
};

export type MonthlyReviewGenerateInput = {
  year: number;
  month: number;
};

export type MonthlyReviewGeneratePayload = {
  year: number;
  month: number;
};

export type MonthlyReviewLogInput = {
  id: string;
  date: string;
  position: string | null;
  resumeCount: number;
  screenCount: number;
  phoneCount: number;
  interviewCount: number;
  offerCount: number;
  entryCount: number;
  source: string | null;
  channel: string | null;
  roleType: string | null;
  priority: string | null;
  summary: string | null;
  problems: string | null;
  reflection: string | null;
};

export type MonthlyReviewPromptInput = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  logCount: number;
  kpiSummary: DashboardKpiSummary;
  logs: MonthlyReviewLogInput[];
};

export type MonthlyReviewResponse = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  logCount: number;
  kpiSummary: DashboardKpiSummary;
  review: MonthlyReviewAiOutput;
};

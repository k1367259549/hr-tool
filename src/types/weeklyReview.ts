import type { DashboardKpiSummary } from "@/types/dashboard";
import type { RecruitLogDateInput } from "@/types/log";

export type WeeklyReviewAiOutput = {
  summary: string;
  keyMetrics: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  nextWeekFocus: string;
  score: number;
};

export type WeeklyReviewGenerateInput = {
  startDate: RecruitLogDateInput;
  endDate: RecruitLogDateInput;
};

export type WeeklyReviewGeneratePayload = {
  startDate: string;
  endDate: string;
};

export type WeeklyReviewLogInput = {
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

export type WeeklyReviewPromptInput = {
  startDate: string;
  endDate: string;
  logCount: number;
  kpiSummary: DashboardKpiSummary;
  logs: WeeklyReviewLogInput[];
};

export type WeeklyReviewResponse = {
  startDate: string;
  endDate: string;
  logCount: number;
  kpiSummary: DashboardKpiSummary;
  review: WeeklyReviewAiOutput;
};

import type { DailyPlan } from "@/types/planner";
import type { DailyReview } from "@/types/review";
import type { RecruitLog } from "@/types/log";

export type DailyExportInput = {
  date: string;
};

export type DailyExportResponse = {
  date: string;
  markdown: string;
};

export type DailyExportData = {
  date: string;
  log: RecruitLog;
  review: DailyReview | null;
  plan: DailyPlan | null;
};

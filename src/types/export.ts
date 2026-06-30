import type { DailyPlan } from "@/types/planner";
import type { DailyReview } from "@/types/review";
import type { RecruitLog } from "@/types/log";
import type { SpreadsheetAnalysisDto, UploadedSpreadsheetDto } from "@/types/spreadsheet";

export type DailyExportInput = {
  date: string;
};

export type DailyExportResponse = {
  date: string;
  markdown: string;
};

export type SpreadsheetAnalysisExportResponse = {
  id: string;
  fileName: string;
  markdown: string;
};

export type DailyExportData = {
  date: string;
  log: RecruitLog;
  review: DailyReview | null;
  plan: DailyPlan | null;
};

export type SpreadsheetAnalysisExportData = {
  upload: UploadedSpreadsheetDto;
  analysis: SpreadsheetAnalysisDto;
};

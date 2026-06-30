import type { Prisma } from "@prisma/client";

export type SpreadsheetFileType = "xlsx" | "csv";
export type SpreadsheetUploadStatus = "COMPLETED" | "FAILED";

export type ParsedSpreadsheetCell = string | number | null;

export type ParsedSpreadsheetRow = Record<string, ParsedSpreadsheetCell>;

export type ParsedSpreadsheet = {
  headers: string[];
  rows: ParsedSpreadsheetRow[];
  rowCount: number;
};

export type NormalizedRecruitingField =
  | "candidateName"
  | "position"
  | "source"
  | "status"
  | "interviewDate"
  | "result";

export type NormalizedRecruitingRow = {
  candidateName?: string;
  position?: string;
  source?: string;
  status?: string;
  interviewDate?: string;
  result?: string;
  raw: Record<string, unknown>;
};

export type SpreadsheetColumnMapping = {
  field: NormalizedRecruitingField;
  header: string;
};

export type SpreadsheetDetectedColumn = {
  header: string;
  mappedField: NormalizedRecruitingField | null;
};

export type SpreadsheetColumnMappingResult = {
  detectedColumns: SpreadsheetDetectedColumn[];
  mappings: SpreadsheetColumnMapping[];
};

export type SpreadsheetMissingFieldCounts = Record<NormalizedRecruitingField, number>;

export type SpreadsheetKpiSummary = {
  totalRows: number;
  positionCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  resultCounts: Record<string, number>;
  missingFieldCounts: SpreadsheetMissingFieldCounts;
};

export type SpreadsheetAnalysisPreview = ParsedSpreadsheet & {
  detectedColumns: SpreadsheetDetectedColumn[];
  columnMappings: SpreadsheetColumnMapping[];
  kpis: SpreadsheetKpiSummary;
  missingFieldWarnings: string[];
  normalizedRows: NormalizedRecruitingRow[];
};

export type UploadedSpreadsheet = {
  id: string;
  fileName: string;
  fileType: string;
  rowCount: number | null;
  status: string;
  createdAt: Date;
};

export type UploadedSpreadsheetDto = Omit<UploadedSpreadsheet, "createdAt"> & {
  createdAt: string;
};

export type SpreadsheetAnalysis = {
  id: string;
  uploadId: string;
  summary: string;
  insights: string;
  problems: string;
  suggestions: string;
  rawJson: Prisma.JsonValue | null;
  model: string;
  createdAt: Date;
};

export type SpreadsheetAnalysisDto = Omit<SpreadsheetAnalysis, "createdAt"> & {
  createdAt: string;
};

export type SpreadsheetAnalysisAiOutput = {
  summary: string;
  insights: string;
  problems: string;
  suggestions: string;
};

export type SpreadsheetAnalysisRepositoryCreateInput = {
  uploadId: string;
  summary: string;
  insights: string;
  problems: string;
  suggestions: string;
  rawJson?: Prisma.InputJsonValue;
  model: string;
};

export type UploadedSpreadsheetRepositoryCreateInput = {
  fileName: string;
  fileType: SpreadsheetFileType;
  rowCount?: number;
  status: SpreadsheetUploadStatus;
};

export type SpreadsheetAnalysisReport = {
  upload: UploadedSpreadsheetDto;
  analysis: SpreadsheetAnalysisDto;
  preview: SpreadsheetAnalysisPreview;
};

export type SavedSpreadsheetAnalysisReport = {
  upload: UploadedSpreadsheetDto;
  analysis: SpreadsheetAnalysisDto | null;
};

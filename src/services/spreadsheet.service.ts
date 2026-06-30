import { spreadsheetAnalysisRepository } from "@/repositories/spreadsheetAnalysis.repository";
import { spreadsheetRepository } from "@/repositories/spreadsheet.repository";
import type {
  SpreadsheetAnalysis,
  SavedSpreadsheetAnalysisReport,
  SpreadsheetAnalysisDto,
  UploadedSpreadsheetDto
} from "@/types/spreadsheet";

export class SpreadsheetServiceError extends Error {
  readonly code = "SPREADSHEET_NOT_FOUND";

  constructor(message: string) {
    super(message);
    this.name = "SpreadsheetServiceError";
  }
}

export const spreadsheetService = {
  async getAnalysisByUploadId(uploadId: string): Promise<SavedSpreadsheetAnalysisReport> {
    const upload = await spreadsheetRepository.findById(uploadId);

    if (!upload) {
      throw new SpreadsheetServiceError("未找到上传记录。");
    }

    const analysis = await spreadsheetAnalysisRepository.findByUploadId(uploadId);

    return {
      upload: toUploadDto(upload),
      analysis: analysis ? toAnalysisDto(analysis) : null
    };
  }
};

export function toUploadDto(upload: {
  id: string;
  fileName: string;
  fileType: string;
  rowCount: number | null;
  status: string;
  createdAt: Date;
}): UploadedSpreadsheetDto {
  return {
    id: upload.id,
    fileName: upload.fileName,
    fileType: upload.fileType,
    rowCount: upload.rowCount,
    status: upload.status,
    createdAt: upload.createdAt.toISOString()
  };
}

export function toAnalysisDto(analysis: {
  id: string;
  uploadId: string;
  summary: string;
  insights: string;
  problems: string;
  suggestions: string;
  rawJson: SpreadsheetAnalysis["rawJson"];
  model: string;
  createdAt: Date;
}): SpreadsheetAnalysisDto {
  return {
    id: analysis.id,
    uploadId: analysis.uploadId,
    summary: analysis.summary,
    insights: analysis.insights,
    problems: analysis.problems,
    suggestions: analysis.suggestions,
    rawJson: analysis.rawJson,
    model: analysis.model,
    createdAt: analysis.createdAt.toISOString()
  };
}

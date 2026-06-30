import type { NextRequest } from "next/server";
import { spreadsheetAnalysisService } from "@/services/spreadsheetAnalysis.service";
import type { SpreadsheetAnalysisReport } from "@/types/spreadsheet";
import { successResponse } from "@/utils/apiResponse";
import { handleSpreadsheetApiError } from "./spreadsheetApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = readSpreadsheetFile(formData);
    const report = await spreadsheetAnalysisService.analyzeUploadedFile(file);

    return successResponse<SpreadsheetAnalysisReport>(report, 201);
  } catch (error) {
    return handleSpreadsheetApiError(error);
  }
}

function readSpreadsheetFile(formData: FormData): File | null {
  const value = formData.get("file");

  return value instanceof File ? value : null;
}


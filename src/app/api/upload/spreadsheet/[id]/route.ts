import { spreadsheetService } from "@/services/spreadsheet.service";
import type { SavedSpreadsheetAnalysisReport } from "@/types/spreadsheet";
import { successResponse } from "@/utils/apiResponse";
import { handleSpreadsheetApiError } from "../spreadsheetApiError";

type SpreadsheetRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: SpreadsheetRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const report = await spreadsheetService.getAnalysisByUploadId(id);

    return successResponse<SavedSpreadsheetAnalysisReport>(report);
  } catch (error) {
    return handleSpreadsheetApiError(error);
  }
}


import { dashboardService } from "@/services/dashboard.service";
import type { DashboardSummaryResponse } from "@/types/dashboard";
import { handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(): Promise<Response> {
  try {
    const summary = await dashboardService.getSummary();

    return successResponse<DashboardSummaryResponse>(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

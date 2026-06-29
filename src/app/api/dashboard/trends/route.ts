import { dashboardService } from "@/services/dashboard.service";
import type { DashboardTrendsResponse } from "@/types/dashboard";
import { handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(): Promise<Response> {
  try {
    const trends = await dashboardService.getTrends();

    return successResponse<DashboardTrendsResponse>(trends);
  } catch (error) {
    return handleApiError(error);
  }
}

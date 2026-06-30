import type { NextRequest } from "next/server";
import { plannerService } from "@/services/planner.service";
import type { DailyPlan } from "@/types/planner";
import { errorResponse, successResponse } from "@/utils/apiResponse";
import { handlePlannerApiError } from "../../plannerApiError";

type PlannerDateRouteContext = {
  params: Promise<{
    date: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: PlannerDateRouteContext
): Promise<Response> {
  try {
    const { date } = await context.params;
    const plan = await plannerService.getPlanByDate({
      date: decodeURIComponent(date)
    });

    if (!plan) {
      return errorResponse("PLAN_NOT_FOUND", "未找到计划。", 404);
    }

    return successResponse<DailyPlan>(plan);
  } catch (error) {
    return handlePlannerApiError(error);
  }
}

import type { NextRequest } from "next/server";
import { plannerService, PlannerServiceError } from "@/services/planner.service";
import type { DailyPlan, PlannerGeneratePayload } from "@/types/planner";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { handlePlannerApiError } from "../plannerApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parsePlannerGeneratePayload(body);
    const plan = await plannerService.generatePlan(payload);

    return successResponse<DailyPlan>(plan, 201);
  } catch (error) {
    return handlePlannerApiError(error);
  }
}

function parsePlannerGeneratePayload(payload: unknown): PlannerGeneratePayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new PlannerServiceError("VALIDATION_ERROR", "Request body must be a JSON object.");
  }

  const date = (payload as Record<string, unknown>).date;

  if (typeof date !== "string" || !date) {
    throw new PlannerServiceError("VALIDATION_ERROR", "Date is required.");
  }

  return {
    date
  };
}

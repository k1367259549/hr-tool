import type { NextRequest } from "next/server";
import {
  dailyWorkspaceService
} from "@/services/dailyWorkspace.service";
import type {
  DailyWorkspaceActivitySnapshot,
  DailyWorkspaceGenerateResult
} from "@/types/dailyWorkspace";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseDailyWorkspaceGeneratePayload } from "@/utils/dailyWorkspaceValidation";
import { handleDailyWorkspaceApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const data = await dailyWorkspaceService.getActivitySnapshot({ date });

    return successResponse<DailyWorkspaceActivitySnapshot>(data);
  } catch (error) {
    return handleDailyWorkspaceApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseDailyWorkspaceGeneratePayload(body);
    const result = await dailyWorkspaceService.generateDailyWorkspace(input);

    return successResponse<DailyWorkspaceGenerateResult>(result);
  } catch (error) {
    return handleDailyWorkspaceApiError(error);
  }
}

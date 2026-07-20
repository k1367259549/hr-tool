import type { NextRequest } from "next/server";
import { dailyWorkspaceService } from "@/services/dailyWorkspace.service";
import type { DailyRecruitingWorkspaceDto } from "@/types/dailyWorkspace";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseDailyWorkspaceSavePayload } from "@/utils/dailyWorkspaceValidation";
import { handleDailyWorkspaceApiError } from "../errorHandling";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseDailyWorkspaceSavePayload(body);
    const workspace = await dailyWorkspaceService.saveDailyWorkspace(input);

    return successResponse<DailyRecruitingWorkspaceDto>(workspace, 201);
  } catch (error) {
    return handleDailyWorkspaceApiError(error);
  }
}

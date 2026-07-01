import type { NextRequest } from "next/server";
import { recruitmentTaskService } from "@/services/recruitmentTask.service";
import type { RecruitmentTaskCenterData, RecruitmentTaskDto } from "@/types/recruitmentTask";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseRecruitmentTaskActionPayload } from "@/utils/recruitmentTaskValidation";
import { handleRecruitmentTaskApiError } from "./errorHandling";

export async function GET(): Promise<Response> {
  try {
    const data = await recruitmentTaskService.getTaskCenter();

    return successResponse<RecruitmentTaskCenterData>(data);
  } catch (error) {
    return handleRecruitmentTaskApiError(error);
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruitmentTaskActionPayload(body);
    const task = await recruitmentTaskService.applyTaskAction(input);

    return successResponse<RecruitmentTaskDto>(task);
  } catch (error) {
    return handleRecruitmentTaskApiError(error);
  }
}

import type { NextRequest } from "next/server";
import { recruitmentTaskService } from "@/services/recruitmentTask.service";
import type { RecruitmentTaskAuditDto } from "@/types/recruitmentTask";
import { successResponse } from "@/utils/apiResponse";
import { handleRecruitmentTaskApiError } from "../../errorHandling";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    const params = await context.params;
    const audits = await recruitmentTaskService.getTaskAudits(params.id);

    return successResponse<RecruitmentTaskAuditDto[]>(audits);
  } catch (error) {
    return handleRecruitmentTaskApiError(error);
  }
}

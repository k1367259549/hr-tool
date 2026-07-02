import type { NextRequest } from "next/server";
import { candidateResumeLinkService } from "@/services/candidateResumeLink.service";
import type { SafeCandidateResumeDto } from "@/types/candidateResumeLink";
import { successResponse } from "@/utils/apiResponse";
import { handleCandidateResumeLinkApiError } from "../errorHandling";

type CandidateResumeItemRouteContext = {
  params: Promise<{
    id: string;
    resumeId: string;
  }>;
};

export async function DELETE(
  _request: NextRequest,
  context: CandidateResumeItemRouteContext
): Promise<Response> {
  try {
    const { id, resumeId } = await context.params;
    const resume = await candidateResumeLinkService.unlinkResume(id, resumeId);

    return successResponse<SafeCandidateResumeDto>(resume);
  } catch (error) {
    return handleCandidateResumeLinkApiError(error);
  }
}

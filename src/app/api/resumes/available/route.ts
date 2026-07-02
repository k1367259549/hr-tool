import type { NextRequest } from "next/server";
import { candidateResumeLinkService } from "@/services/candidateResumeLink.service";
import type { AvailableResumeListDto } from "@/types/candidateResumeLink";
import { successResponse } from "@/utils/apiResponse";
import { parseAvailableResumeQuery } from "@/utils/candidateResumeLinkValidation";
import { handleCandidateResumeLinkApiError } from "../../candidates/[id]/resumes/errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseAvailableResumeQuery(request.nextUrl.searchParams);
    const result = await candidateResumeLinkService.listAvailableResumes(query);

    return successResponse<AvailableResumeListDto>(result);
  } catch (error) {
    return handleCandidateResumeLinkApiError(error);
  }
}

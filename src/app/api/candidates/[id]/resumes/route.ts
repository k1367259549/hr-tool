import type { NextRequest } from "next/server";
import { candidateResumeLinkService } from "@/services/candidateResumeLink.service";
import type { SafeCandidateResumeDto } from "@/types/candidateResumeLink";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseLinkResumePayload } from "@/utils/candidateResumeLinkValidation";
import { handleCandidateResumeLinkApiError } from "./errorHandling";

type CandidateResumeRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: CandidateResumeRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const resumes = await candidateResumeLinkService.listCandidateResumes(id);

    return successResponse<SafeCandidateResumeDto[]>(resumes);
  } catch (error) {
    return handleCandidateResumeLinkApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: CandidateResumeRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseLinkResumePayload(body);
    const resume = await candidateResumeLinkService.linkResume(id, input);

    return successResponse<SafeCandidateResumeDto>(resume);
  } catch (error) {
    return handleCandidateResumeLinkApiError(error);
  }
}

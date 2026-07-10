import { listInterviewScheduleSyncsByCandidate } from "@/lib/interviewScheduling/interviewScheduleSync";
import { ApiRequestError, handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const candidateId = url.searchParams.get("candidateId")?.trim();

    if (!candidateId) {
      throw new ApiRequestError("VALIDATION_ERROR", "candidateId is required.", 400);
    }

    const items = await listInterviewScheduleSyncsByCandidate(candidateId);

    return successResponse({ items }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

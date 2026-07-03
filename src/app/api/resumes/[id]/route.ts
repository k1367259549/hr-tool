import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resumeLibraryService } from "@/services/resumeLibrary.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { ResumeDetailDto } from "@/types/resumeLibrary";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseResumeMetadataUpdatePayload } from "@/utils/resumeLibraryValidation";
import { handleResumeLibraryApiError } from "../errorHandling";

type ResumeRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: ResumeRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const resume = await resumeLibraryService.getResume(id);

    return NextResponse.json<ApiSuccessResponse<ResumeDetailDto>>(
      {
        data: resume,
        error: null,
        success: true
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return handleResumeLibraryApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: ResumeRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseResumeMetadataUpdatePayload(body);
    const resume = await resumeLibraryService.updateResumeMetadata(id, input);

    return successResponse<ResumeDetailDto>(resume);
  } catch (error) {
    return handleResumeLibraryApiError(error);
  }
}

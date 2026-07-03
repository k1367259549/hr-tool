import type { NextRequest } from "next/server";
import { resumeLibraryService } from "@/services/resumeLibrary.service";
import type { ResumeListResultDto, ResumeUploadResultDto } from "@/types/resumeLibrary";
import { successResponse } from "@/utils/apiResponse";
import {
  parseResumeListQuery,
  parseResumeUploadFormData,
  ResumeLibraryValidationError
} from "@/utils/resumeLibraryValidation";
import { handleResumeLibraryApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseResumeListQuery(request.nextUrl.searchParams);
    const result = await resumeLibraryService.listResumes(query);

    return successResponse<ResumeListResultDto>(result);
  } catch (error) {
    return handleResumeLibraryApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await readResumeFormData(request);
    const input = parseResumeUploadFormData(formData);
    const result = await resumeLibraryService.uploadResume(input);

    return successResponse<ResumeUploadResultDto>(result, 201);
  } catch (error) {
    return handleResumeLibraryApiError(error);
  }
}

async function readResumeFormData(request: NextRequest): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw new ResumeLibraryValidationError("请求必须是有效的 multipart/form-data。");
  }
}

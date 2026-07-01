import type { NextRequest } from "next/server";
import { recruiterWorkspaceService } from "@/services/recruiterWorkspace.service";
import type { RecruiterWorkspaceData } from "@/types/recruiterWorkspace";
import { successResponse } from "@/utils/apiResponse";
import { handleRecruiterWorkspaceApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const data = await recruiterWorkspaceService.getWorkspace({ date });

    return successResponse<RecruiterWorkspaceData>(data);
  } catch (error) {
    return handleRecruiterWorkspaceApiError(error);
  }
}

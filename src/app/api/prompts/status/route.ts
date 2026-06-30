import { promptService } from "@/services/prompt.service";
import type { PromptStatusResponse } from "@/types/prompt";
import { handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(): Promise<Response> {
  try {
    const status = await promptService.getStatus();

    return successResponse<PromptStatusResponse>(status);
  } catch (error) {
    return handleApiError(error);
  }
}

import { settingsService } from "@/services/settings.service";
import type { SettingsStatus } from "@/types/settings";
import { handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(): Promise<Response> {
  try {
    const status = await settingsService.getStatus();

    return successResponse<SettingsStatus>(status);
  } catch (error) {
    return handleApiError(error);
  }
}

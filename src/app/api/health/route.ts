import { healthService, type HealthData } from "@/services/health.service";
import { successResponse } from "@/utils/apiResponse";

export async function GET(): Promise<Response> {
  const health = await healthService.getHealth();

  return successResponse<HealthData>(health);
}

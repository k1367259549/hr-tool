import { settingsService } from "@/services/settings.service";

export type HealthData = {
  status: "ok";
  database: "connected" | "disconnected";
  ai: "configured" | "not configured";
};

export const healthService = {
  async getHealth(): Promise<HealthData> {
    const settingsStatus = await settingsService.getStatus();

    return {
      status: "ok",
      database: settingsStatus.database.connected ? "connected" : "disconnected",
      ai: settingsStatus.ai.status === "ready" ? "configured" : "not configured"
    };
  }
};

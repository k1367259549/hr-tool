import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryLogRepository,
  createRecruitLog,
  readApiJson,
  resetTestDb,
  type MockLogRepository
} from "../setup/testDb";
import type { DashboardSummaryResponse } from "@/types/dashboard";

vi.mock("@/repositories/log.repository", () => ({
  logRepository: logRepositoryMock
}));

const logRepositoryMock: MockLogRepository = createMemoryLogRepository();

describe("Dashboard summary API", () => {
  beforeEach(() => {
    resetTestDb();
    Object.assign(
      logRepositoryMock,
      createMemoryLogRepository([
        createRecruitLog({
          date: new Date("2026-01-01T00:00:00.000Z"),
          entryCount: 1,
          interviewCount: 4,
          offerCount: 2,
          phoneCount: 8,
          resumeCount: 20,
          screenCount: 10
        }),
        createRecruitLog({
          date: new Date("2026-01-02T00:00:00.000Z"),
          entryCount: 0,
          interviewCount: 2,
          offerCount: 1,
          phoneCount: 4,
          resumeCount: 10,
          screenCount: 5
        })
      ])
    );
  });

  it("GET /api/dashboard/summary returns KPI summary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T12:00:00.000Z"));

    try {
      const { GET } = await import("@/app/api/dashboard/summary/route");
      const response = await GET();
      const json = await readApiJson<DashboardSummaryResponse>(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data?.today.resumeCount).toBe(10);
      expect(json.data?.today.screenRate).toBe(0.5);
      expect(json.data?.week.resumeCount).toBe(30);
      expect(json.data?.all.logCount).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

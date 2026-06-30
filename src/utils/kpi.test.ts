import { describe, expect, it } from "vitest";
import type { RecruitLog } from "@/types/log";
import { calculateKpiRates, calculateKpiSummary } from "@/utils/kpi";

describe("kpi utilities", () => {
  it("KPI rates calculate correctly", () => {
    expect(
      calculateKpiRates({
        entryCount: 1,
        interviewCount: 4,
        offerCount: 2,
        phoneCount: 8,
        resumeCount: 20,
        screenCount: 10
      })
    ).toEqual({
      entryRate: 0.5,
      interviewRate: 0.4,
      offerRate: 0.5,
      screenRate: 0.5
    });
  });

  it("KPI summary totals and rates are deterministic", () => {
    const logs: RecruitLog[] = [
      createLog("2026-01-01", 10, 5, 4, 2, 1, 0),
      createLog("2026-01-02", 30, 15, 8, 6, 3, 1)
    ];

    expect(calculateKpiSummary(logs)).toEqual({
      entryCount: 1,
      entryRate: 0.25,
      interviewCount: 8,
      interviewRate: 0.4,
      logCount: 2,
      offerCount: 4,
      offerRate: 0.5,
      phoneCount: 12,
      resumeCount: 40,
      screenCount: 20,
      screenRate: 0.5
    });
  });
});

function createLog(
  date: string,
  resumeCount: number,
  screenCount: number,
  phoneCount: number,
  interviewCount: number,
  offerCount: number,
  entryCount: number
): RecruitLog {
  const now = new Date(`${date}T00:00:00.000Z`);

  return {
    channel: null,
    createdAt: now,
    date: now,
    entryCount,
    id: date,
    interviewCount,
    offerCount,
    phoneCount,
    position: null,
    priority: null,
    problems: null,
    reflection: null,
    resumeCount,
    roleType: null,
    screenCount,
    source: null,
    summary: null,
    updatedAt: now
  };
}

import { describe, expect, it, vi } from "vitest";
import {
  listInterviewScheduleSyncsByCandidate,
  toInterviewScheduleSyncHistoryItem
} from "@/lib/interviewScheduling/interviewScheduleSync";
import type { InterviewScheduleSyncRecord } from "@/lib/interviewScheduling/interviewScheduleSync";

describe("interviewScheduleSync history", () => {
  it("maps sync records to safe history items without internal Feishu config", () => {
    const item = toInterviewScheduleSyncHistoryItem(createSyncRecord());

    expect(item).toEqual({
      bitableRecordId: "rec_real_1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      createdAt: "2026-07-10T02:00:00.000Z",
      errorCode: null,
      errorMessage: null,
      status: "BITABLE_SYNCED",
      syncId: "sync-1",
      updatedAt: "2026-07-10T02:05:00.000Z"
    });
    expect(JSON.stringify(item)).not.toContain("idempotencyKey");
    expect(JSON.stringify(item)).not.toContain("base-token");
    expect(JSON.stringify(item)).not.toContain("tbl_test");
  });

  it("lists sync history by candidate with createdAt descending order", async () => {
    const records = [
      createSyncRecord({
        candidateId: "candidate-1",
        createdAt: new Date("2026-07-10T02:00:00.000Z"),
        id: "sync-old"
      }),
      createSyncRecord({
        candidateId: "candidate-2",
        createdAt: new Date("2026-07-10T03:00:00.000Z"),
        id: "sync-other"
      }),
      createSyncRecord({
        candidateId: "candidate-1",
        createdAt: new Date("2026-07-10T04:00:00.000Z"),
        id: "sync-new"
      })
    ];
    const findMany = vi.fn(
      async (query: {
        where: {
          candidateId: string;
        };
        orderBy: {
          createdAt: "desc";
        };
      }): Promise<InterviewScheduleSyncRecord[]> =>
      records
        .filter((record) => record.candidateId === query.where.candidateId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    );

    const items = await listInterviewScheduleSyncsByCandidate("candidate-1", {
      findMany
    });

    expect(findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        candidateId: "candidate-1"
      }
    });
    expect(items.map((item) => item.syncId)).toEqual(["sync-new", "sync-old"]);
    expect(items.every((item) => item.candidateId === "candidate-1")).toBe(true);
  });
});

function createSyncRecord(
  overrides: Partial<InterviewScheduleSyncRecord> = {}
): InterviewScheduleSyncRecord {
  return {
    calendarEventId: "event-1",
    candidateId: "candidate-1",
    createdAt: new Date("2026-07-10T02:00:00.000Z"),
    endTime: new Date("2026-07-10T03:00:00.000Z"),
    feishuAppToken: "base-token",
    feishuRecordId: "rec_real_1",
    feishuTableId: "tbl_test",
    id: "sync-1",
    idempotencyKey: "schedule:test-key-1",
    interviewerEmail: "interviewer@example.com",
    lastErrorCode: null,
    lastErrorMessage: null,
    retryCount: 0,
    round: "一面",
    startTime: new Date("2026-07-10T02:00:00.000Z"),
    status: "BITABLE_SYNCED",
    updatedAt: new Date("2026-07-10T02:05:00.000Z"),
    ...overrides
  };
}

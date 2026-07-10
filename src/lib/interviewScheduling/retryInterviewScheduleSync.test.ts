import { describe, expect, it, vi } from "vitest";
import {
  retryInterviewScheduleSync
} from "@/lib/interviewScheduling/retryInterviewScheduleSync";
import type { InterviewScheduleSyncRecord } from "@/lib/interviewScheduling/interviewScheduleSync";

const env = {
  FEISHU_APP_ID: "cli_test",
  FEISHU_APP_SECRET: "app-secret",
  NODE_ENV: "test"
} satisfies NodeJS.ProcessEnv;

describe("retryInterviewScheduleSync", () => {
  it("retries bitable sync without creating a new calendar event", async () => {
    const updateCandidateInterviewStatus = vi.fn(async () => undefined);
    const markBitableSynced = vi.fn(async () =>
      createSyncRecord({
        status: "BITABLE_SYNCED"
      })
    );

    const result = await retryInterviewScheduleSync(
      {
        syncId: "sync-1"
      },
      {
        env,
        findSyncById: vi.fn(async () => createSyncRecord()),
        markBitableSynced,
        now: () => new Date("2026-07-09T12:30:00.000Z"),
        updateCandidateInterviewStatus
      }
    );

    expect(result).toEqual({
      bitableRecordId: "rec_real_1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      retryCount: 0,
      success: true,
      syncId: "sync-1",
      syncStatus: "BITABLE_SYNCED"
    });
    expect(updateCandidateInterviewStatus).toHaveBeenCalledTimes(1);
    expect(updateCandidateInterviewStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        calendarEventId: "event-1",
        recordId: "rec_real_1"
      })
    );
    expect(markBitableSynced).toHaveBeenCalledWith("sync-1");
  });

  it("keeps failed status and increments retry count when bitable retry fails", async () => {
    const markSyncFailure = vi.fn(async () =>
      createSyncRecord({
        lastErrorCode: "FEISHU_SYNC_RETRY_FAILED",
        lastErrorMessage: "retry unavailable",
        retryCount: 2,
        status: "BITABLE_SYNC_FAILED"
      })
    );

    const result = await retryInterviewScheduleSync(
      {
        syncId: "sync-1"
      },
      {
        env,
        findSyncById: vi.fn(async () =>
          createSyncRecord({
            retryCount: 1
          })
        ),
        markSyncFailure,
        updateCandidateInterviewStatus: vi.fn(async () => {
          throw new Error("retry unavailable");
        })
      }
    );

    expect(result).toEqual({
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: "飞书表格重试同步失败：retry unavailable",
      retryCount: 2,
      success: false,
      syncId: "sync-1"
    });
    expect(markSyncFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "FEISHU_SYNC_RETRY_FAILED",
        errorMessage: "retry unavailable",
        incrementRetryCount: true,
        status: "BITABLE_SYNC_FAILED",
        syncId: "sync-1"
      })
    );
  });
});

function createSyncRecord(
  overrides: Partial<InterviewScheduleSyncRecord> = {}
): InterviewScheduleSyncRecord {
  const now = new Date("2026-07-09T00:00:00.000Z");

  return {
    calendarEventId: "event-1",
    candidateId: "candidate-1",
    createdAt: now,
    endTime: new Date("2026-07-10T11:00:00.000+08:00"),
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
    startTime: new Date("2026-07-10T10:00:00.000+08:00"),
    status: "BITABLE_SYNC_FAILED",
    updatedAt: now,
    ...overrides
  };
}

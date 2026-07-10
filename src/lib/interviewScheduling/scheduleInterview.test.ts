import { describe, expect, it, vi } from "vitest";
import { scheduleInterview } from "@/lib/interviewScheduling/scheduleInterview";
import type { InterviewScheduleSyncRecord } from "@/lib/interviewScheduling/interviewScheduleSync";
import type { CandidateDto } from "@/types/candidate";
import type { FeishuBitableRecordMapping } from "@/lib/feishu/feishuBitableMapping";

const env = {
  FEISHU_APP_ID: "cli_test",
  FEISHU_APP_SECRET: "app-secret",
  FEISHU_BASE_APP_TOKEN: "base-token",
  FEISHU_CANDIDATE_TABLE_ID: "tbl_test",
  FEISHU_DEFAULT_CALENDAR_ID: "primary",
  NODE_ENV: "test"
} satisfies NodeJS.ProcessEnv;

const candidate = {
  archivedAt: null,
  audits: [],
  createdAt: "2026-07-09T00:00:00.000Z",
  currentCompany: "Test Co",
  currentTitle: "Backend Intern",
  email: "candidate@example.com",
  fullName: "Candidate One",
  id: "candidate-1",
  latestActivityAt: "2026-07-09T00:00:00.000Z",
  maskedEmail: "c***@example.com",
  maskedPhone: null,
  notes: null,
  owner: "HR",
  phone: null,
  resumeCount: 1,
  sourceChannel: "manual",
  status: "ACTIVE",
  tags: [],
  targetRoles: ["Backend Intern"],
  updatedAt: "2026-07-09T00:00:00.000Z"
} satisfies CandidateDto;

const input = {
  candidateId: "candidate-1",
  endTime: "2026-07-10T11:00:00.000+08:00",
  idempotencyKey: "schedule:test-key-1",
  interviewerEmail: "interviewer@example.com",
  mode: "视频面试",
  round: "一面",
  startTime: "2026-07-10T10:00:00.000+08:00"
};

describe("scheduleInterview", () => {
  it("does not create calendar event when interviewer is busy", async () => {
    const createCalendarEvent = vi.fn();
    const createScheduleSync = vi.fn();
    const updateCandidateInterviewStatus = vi.fn();

    const result = await scheduleInterview(input, {
      createScheduleSync,
      createCalendarEvent,
      env,
      findBitableRecordMapping: vi.fn(async () => createMapping()),
      findScheduleSyncByIdempotencyKey: vi.fn(async () => null),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => [
        {
          endTime: input.endTime,
          startTime: input.startTime
        }
      ]),
      updateCandidateInterviewStatus
    });

    expect(result).toEqual({
      code: "TIME_CONFLICT",
      message: "面试官该时间段忙碌，请调整时间后重试。",
      success: false
    });
    expect(createCalendarEvent).not.toHaveBeenCalled();
    expect(createScheduleSync).not.toHaveBeenCalled();
    expect(updateCandidateInterviewStatus).not.toHaveBeenCalled();
  });

  it("creates calendar event and updates bitable when interviewer is available", async () => {
    const updateCandidateInterviewStatus = vi.fn(async () => undefined);
    const markScheduleSyncBitableSynced = vi.fn(async () =>
      createScheduleSyncRecord({
        status: "BITABLE_SYNCED"
      })
    );

    const result = await scheduleInterview(input, {
      createScheduleSync: vi.fn(async () => createScheduleSyncRecord()),
      createCalendarEvent: vi.fn(async () => ({
        calendarEventId: "event-1"
      })),
      env,
      findBitableRecordMapping: vi.fn(async () =>
        createMapping({
          recordId: "rec_real_1"
        })
      ),
      findScheduleSyncByIdempotencyKey: vi.fn(async () => null),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      markScheduleCalendarCreated: vi.fn(async () => createScheduleSyncRecord()),
      markScheduleSyncBitableSynced,
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      updateCandidateInterviewStatus
    });

    expect(result).toEqual({
      bitableRecordId: "rec_real_1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      deduplicated: false,
      scheduleSyncStatus: "BITABLE_SYNCED",
      success: true,
      syncId: "sync-1",
      syncStatus: "SUCCESS"
    });
    expect(markScheduleSyncBitableSynced).toHaveBeenCalledWith("sync-1");
    expect(updateCandidateInterviewStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        appToken: "base-token",
        calendarEventId: "event-1",
        interviewerEmail: "interviewer@example.com",
        recordId: "rec_real_1",
        round: "一面",
        scheduledStartTime: input.startTime,
        status: "已预约面试",
        tableId: "tbl_test"
      })
    );
  });

  it("does not create event or update bitable when mapping is missing", async () => {
    const createCalendarEvent = vi.fn();
    const createScheduleSync = vi.fn();
    const updateCandidateInterviewStatus = vi.fn();

    const result = await scheduleInterview(input, {
      createScheduleSync,
      createCalendarEvent,
      env,
      findBitableRecordMapping: vi.fn(async () => null),
      findScheduleSyncByIdempotencyKey: vi.fn(async () => null),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      updateCandidateInterviewStatus
    });

    expect(result).toEqual({
      code: "FEISHU_RECORD_MAPPING_NOT_FOUND",
      message: "未找到候选人与飞书多维表格记录的映射，无法安排面试。",
      success: false
    });
    expect(createCalendarEvent).not.toHaveBeenCalled();
    expect(createScheduleSync).not.toHaveBeenCalled();
    expect(updateCandidateInterviewStatus).not.toHaveBeenCalled();
  });

  it("records partial failure when bitable update fails after calendar event creation", async () => {
    const markScheduleSyncFailure = vi.fn(async () =>
      createScheduleSyncRecord({
        lastErrorCode: "FEISHU_SYNC_ERROR",
        lastErrorMessage: "bitable unavailable",
        status: "BITABLE_SYNC_FAILED"
      })
    );
    const result = await scheduleInterview(input, {
      createScheduleSync: vi.fn(async () => createScheduleSyncRecord()),
      createCalendarEvent: vi.fn(async () => ({
        calendarEventId: "event-1"
      })),
      env,
      findBitableRecordMapping: vi.fn(async () => createMapping()),
      findScheduleSyncByIdempotencyKey: vi.fn(async () => null),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      markScheduleCalendarCreated: vi.fn(async () => createScheduleSyncRecord()),
      markScheduleSyncFailure,
      updateCandidateInterviewStatus: vi.fn(async () => {
        throw new Error("bitable unavailable");
      })
    });

    expect(result).toEqual({
      bitableRecordId: "rec_real_default",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: false,
      message: "面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。",
      success: false,
      syncId: "sync-1",
      syncStatus: "BITABLE_SYNC_FAILED"
    });
    expect(markScheduleSyncFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "FEISHU_SYNC_ERROR",
        errorMessage: "bitable unavailable",
        status: "BITABLE_SYNC_FAILED",
        syncId: "sync-1"
      })
    );
  });

  it("returns existing success for repeated idempotency key without creating another calendar event", async () => {
    const createCalendarEvent = vi.fn();
    const result = await scheduleInterview(input, {
      createCalendarEvent,
      env,
      findScheduleSyncByIdempotencyKey: vi.fn(async () =>
        createScheduleSyncRecord({
          calendarEventId: "event-existing",
          status: "BITABLE_SYNCED"
        })
      ),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      updateCandidateInterviewStatus: vi.fn()
    });

    expect(result).toEqual({
      bitableRecordId: "rec_real_default",
      calendarEventId: "event-existing",
      candidateId: "candidate-1",
      deduplicated: true,
      scheduleSyncStatus: "BITABLE_SYNCED",
      success: true,
      syncId: "sync-1",
      syncStatus: "SUCCESS"
    });
    expect(createCalendarEvent).not.toHaveBeenCalled();
  });

  it("returns existing partial failure for repeated idempotency key without creating another calendar event", async () => {
    const createCalendarEvent = vi.fn();
    const result = await scheduleInterview(input, {
      createCalendarEvent,
      env,
      findScheduleSyncByIdempotencyKey: vi.fn(async () =>
        createScheduleSyncRecord({
          calendarEventId: "event-existing",
          status: "BITABLE_SYNC_FAILED"
        })
      ),
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      updateCandidateInterviewStatus: vi.fn()
    });

    expect(result).toEqual({
      bitableRecordId: "rec_real_default",
      calendarEventId: "event-existing",
      candidateId: "candidate-1",
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: true,
      message: "面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。",
      success: false,
      syncId: "sync-1",
      syncStatus: "BITABLE_SYNC_FAILED"
    });
    expect(createCalendarEvent).not.toHaveBeenCalled();
  });
});

function createMapping(
  overrides: Partial<FeishuBitableRecordMapping> = {}
): FeishuBitableRecordMapping {
  const now = new Date("2026-07-09T00:00:00.000Z");

  return {
    appToken: "base-token",
    candidateId: "candidate-1",
    createdAt: now,
    id: "mapping-1",
    lastError: null,
    lastSyncedAt: null,
    recordId: "rec_real_default",
    syncStatus: null,
    tableId: "tbl_test",
    updatedAt: now,
    ...overrides
  };
}

function createScheduleSyncRecord(
  overrides: Partial<InterviewScheduleSyncRecord> = {}
): InterviewScheduleSyncRecord {
  const now = new Date("2026-07-09T00:00:00.000Z");

  return {
    calendarEventId: "event-1",
    candidateId: "candidate-1",
    createdAt: now,
    endTime: new Date(input.endTime),
    feishuAppToken: "base-token",
    feishuRecordId: "rec_real_default",
    feishuTableId: "tbl_test",
    id: "sync-1",
    idempotencyKey: "schedule:test-key-1",
    interviewerEmail: "interviewer@example.com",
    lastErrorCode: null,
    lastErrorMessage: null,
    retryCount: 0,
    round: "一面",
    startTime: new Date(input.startTime),
    status: "CALENDAR_CREATED",
    updatedAt: now,
    ...overrides
  };
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";

const scheduleInterviewMock = vi.hoisted(() => vi.fn());
const retryInterviewScheduleSyncMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/interviewScheduling/scheduleInterview", () => ({
  ScheduleInterviewError: class ScheduleInterviewError extends Error {
    readonly code:
      | "VALIDATION_ERROR"
      | "CONFIG_ERROR"
      | "FEISHU_SYNC_ERROR";

    constructor(
      code: "VALIDATION_ERROR" | "CONFIG_ERROR" | "FEISHU_SYNC_ERROR",
      message: string
    ) {
      super(message);
      this.name = "ScheduleInterviewError";
      this.code = code;
    }
  },
  scheduleInterview: scheduleInterviewMock
}));

vi.mock("@/lib/interviewScheduling/retryInterviewScheduleSync", () => ({
  retryInterviewScheduleSync: retryInterviewScheduleSyncMock
}));

describe("POST /api/interviews/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules interview through the service layer after HR confirmation", async () => {
    scheduleInterviewMock.mockResolvedValueOnce({
      bitableRecordId: "candidate-1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      deduplicated: false,
      success: true,
      syncStatus: "SUCCESS"
    });

    const { POST } = await import("@/app/api/interviews/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule", createSchedulePayload())
    );
    const json = await readApiJson<{ calendarEventId: string }>(response);

    expect(response.status).toBe(201);
    expect(scheduleInterviewMock).toHaveBeenCalledWith(createSchedulePayload());
    expect(json.data?.calendarEventId).toBe("event-1");
    expect(JSON.stringify(json)).not.toContain("FEISHU_APP_SECRET");
    expect(JSON.stringify(json)).not.toContain("app-secret");
  });

  it("returns TIME_CONFLICT without leaking provider details", async () => {
    scheduleInterviewMock.mockResolvedValueOnce({
      code: "TIME_CONFLICT",
      message: "面试官该时间段忙碌，请调整时间后重试。",
      success: false
    });

    const { POST } = await import("@/app/api/interviews/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule", createSchedulePayload())
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(409);
    expect(json.error?.code).toBe("TIME_CONFLICT");
    expect(JSON.stringify(json)).not.toContain("tenant_access_token");
  });

  it("returns FEISHU_RECORD_MAPPING_NOT_FOUND without leaking secrets", async () => {
    scheduleInterviewMock.mockResolvedValueOnce({
      code: "FEISHU_RECORD_MAPPING_NOT_FOUND",
      message: "未找到候选人与飞书多维表格记录的映射，无法安排面试。",
      success: false
    });

    const { POST } = await import("@/app/api/interviews/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule", createSchedulePayload())
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(409);
    expect(json.error?.code).toBe("FEISHU_RECORD_MAPPING_NOT_FOUND");
    expect(JSON.stringify(json)).not.toContain("tenant_access_token");
    expect(JSON.stringify(json)).not.toContain("app-secret");
  });

  it("returns partial sync failure with syncId and calendar event without leaking secrets", async () => {
    scheduleInterviewMock.mockResolvedValueOnce({
      bitableRecordId: "rec_real_1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: true,
      message: "面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。",
      success: false,
      syncId: "sync-1",
      syncStatus: "BITABLE_SYNC_FAILED"
    });

    const { POST } = await import("@/app/api/interviews/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule", createSchedulePayload())
    );
    const json = await readApiJson<{ syncId: string; calendarEventId: string }>(response);

    expect(response.status).toBe(207);
    expect(json.error?.code).toBe("FEISHU_PARTIAL_SYNC_FAILED");
    expect(json.data?.syncId).toBe("sync-1");
    expect(json.data?.calendarEventId).toBe("event-1");
    expect(json.data).toMatchObject({ deduplicated: true });
    expect(JSON.stringify(json)).not.toContain("tenant_access_token");
    expect(JSON.stringify(json)).not.toContain("app-secret");
  });

  it("rejects invalid payload before calling service", async () => {
    const { POST } = await import("@/app/api/interviews/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule", {
        candidateId: "candidate-1"
      })
    );

    expect(response.status).toBe(400);
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/interviews/schedule/retry-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries bitable sync through the service layer without leaking secrets", async () => {
    retryInterviewScheduleSyncMock.mockResolvedValueOnce({
      bitableRecordId: "rec_real_1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      retryCount: 1,
      success: true,
      syncId: "sync-1",
      syncStatus: "BITABLE_SYNCED"
    });

    const { POST } = await import("@/app/api/interviews/schedule/retry-sync/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule/retry-sync", {
        syncId: "sync-1"
      })
    );
    const json = await readApiJson<{ syncId: string; calendarEventId: string }>(response);

    expect(response.status).toBe(200);
    expect(retryInterviewScheduleSyncMock).toHaveBeenCalledWith({ syncId: "sync-1" });
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
    expect(json.data?.syncId).toBe("sync-1");
    expect(json.data?.calendarEventId).toBe("event-1");
    expect(JSON.stringify(json)).not.toContain("tenant_access_token");
    expect(JSON.stringify(json)).not.toContain("app-secret");
  });

  it("returns retry failure without creating a schedule", async () => {
    retryInterviewScheduleSyncMock.mockResolvedValueOnce({
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: "飞书表格重试同步失败：retry unavailable",
      retryCount: 2,
      success: false,
      syncId: "sync-1"
    });

    const { POST } = await import("@/app/api/interviews/schedule/retry-sync/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/interviews/schedule/retry-sync", {
        syncId: "sync-1"
      })
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(502);
    expect(json.error?.code).toBe("FEISHU_SYNC_RETRY_FAILED");
    expect(scheduleInterviewMock).not.toHaveBeenCalled();
  });
});

function createSchedulePayload() {
  return {
    candidateId: "candidate-1",
    endTime: "2026-07-10T11:00",
    idempotencyKey: "schedule:test-key-1",
    interviewerEmail: "interviewer@example.com",
    mode: "视频面试",
    round: "一面",
    startTime: "2026-07-10T10:00"
  };
}

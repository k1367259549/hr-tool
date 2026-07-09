import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";

const scheduleInterviewMock = vi.hoisted(() => vi.fn());

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

describe("POST /api/interviews/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules interview through the service layer after HR confirmation", async () => {
    scheduleInterviewMock.mockResolvedValueOnce({
      bitableRecordId: "candidate-1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
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

function createSchedulePayload() {
  return {
    candidateId: "candidate-1",
    endTime: "2026-07-10T11:00",
    interviewerEmail: "interviewer@example.com",
    mode: "视频面试",
    round: "一面",
    startTime: "2026-07-10T10:00"
  };
}

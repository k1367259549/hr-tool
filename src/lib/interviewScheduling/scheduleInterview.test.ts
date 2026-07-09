import { describe, expect, it, vi } from "vitest";
import {
  scheduleInterview,
  ScheduleInterviewError
} from "@/lib/interviewScheduling/scheduleInterview";
import type { CandidateDto } from "@/types/candidate";

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
  interviewerEmail: "interviewer@example.com",
  mode: "视频面试",
  round: "一面",
  startTime: "2026-07-10T10:00:00.000+08:00"
};

describe("scheduleInterview", () => {
  it("does not create calendar event when interviewer is busy", async () => {
    const createCalendarEvent = vi.fn();
    const updateCandidateInterviewStatus = vi.fn();

    const result = await scheduleInterview(input, {
      createCalendarEvent,
      env,
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
    expect(updateCandidateInterviewStatus).not.toHaveBeenCalled();
  });

  it("creates calendar event and updates bitable when interviewer is available", async () => {
    const updateCandidateInterviewStatus = vi.fn(async () => undefined);

    const result = await scheduleInterview(input, {
      createCalendarEvent: vi.fn(async () => ({
        calendarEventId: "event-1"
      })),
      env,
      getCandidate: vi.fn(async () => candidate),
      listBusyTimes: vi.fn(async () => []),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      updateCandidateInterviewStatus
    });

    expect(result).toEqual({
      bitableRecordId: "candidate-1",
      calendarEventId: "event-1",
      candidateId: "candidate-1",
      success: true,
      syncStatus: "SUCCESS"
    });
    expect(updateCandidateInterviewStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        appToken: "base-token",
        calendarEventId: "event-1",
        interviewerEmail: "interviewer@example.com",
        recordId: "candidate-1",
        round: "一面",
        scheduledStartTime: input.startTime,
        status: "已预约面试",
        tableId: "tbl_test"
      })
    );
  });

  it("throws when bitable update fails after calendar event creation", async () => {
    await expect(
      scheduleInterview(input, {
        createCalendarEvent: vi.fn(async () => ({
          calendarEventId: "event-1"
        })),
        env,
        getCandidate: vi.fn(async () => candidate),
        listBusyTimes: vi.fn(async () => []),
        updateCandidateInterviewStatus: vi.fn(async () => {
          throw new Error("bitable unavailable");
        })
      })
    ).rejects.toMatchObject({
      code: "FEISHU_SYNC_ERROR",
      message: "飞书日程已创建，但多维表格更新失败：bitable unavailable"
    } satisfies Partial<ScheduleInterviewError>);
  });
});

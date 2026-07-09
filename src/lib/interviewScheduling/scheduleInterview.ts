import { FeishuTenantAccessTokenProvider, createFeishuAuthConfigFromEnv } from "@/lib/feishu/feishuAuth";
import { updateFeishuCandidateInterviewStatus } from "@/lib/feishu/feishuBitable";
import {
  createFeishuCalendarEvent,
  listFeishuBusyTimes
} from "@/lib/feishu/feishuCalendar";
import { FeishuClient } from "@/lib/feishu/feishuClient";
import { logger } from "@/lib/logger";
import { candidateService } from "@/services/candidate.service";
import type { CandidateDto } from "@/types/candidate";

export type ScheduleInterviewInput = {
  candidateId: string;
  interviewerEmail: string;
  startTime: string;
  endTime: string;
  round: string;
  mode: string;
};

export type ScheduleInterviewResult =
  | {
      success: true;
      candidateId: string;
      calendarEventId: string;
      bitableRecordId: string;
      syncStatus: "SUCCESS";
    }
  | {
      success: false;
      code: "TIME_CONFLICT";
      message: string;
    };

export type ScheduleInterviewDependencies = {
  getCandidate?: (candidateId: string) => Promise<CandidateDto>;
  listBusyTimes?: typeof listFeishuBusyTimes;
  createCalendarEvent?: typeof createFeishuCalendarEvent;
  updateCandidateInterviewStatus?: typeof updateFeishuCandidateInterviewStatus;
  client?: Pick<FeishuClient, "request">;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
};

export class ScheduleInterviewError extends Error {
  readonly code: "VALIDATION_ERROR" | "CONFIG_ERROR" | "FEISHU_SYNC_ERROR";

  constructor(
    code: "VALIDATION_ERROR" | "CONFIG_ERROR" | "FEISHU_SYNC_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ScheduleInterviewError";
    this.code = code;
  }
}

export async function scheduleInterview(
  input: ScheduleInterviewInput,
  dependencies: ScheduleInterviewDependencies = {}
): Promise<ScheduleInterviewResult> {
  validateScheduleInterviewInput(input);

  const env = dependencies.env ?? process.env;
  const client = dependencies.client ?? createDefaultFeishuClient(env);
  const getCandidate = dependencies.getCandidate ?? candidateService.getCandidate;
  const listBusyTimes = dependencies.listBusyTimes ?? listFeishuBusyTimes;
  const createCalendarEvent = dependencies.createCalendarEvent ?? createFeishuCalendarEvent;
  const updateCandidateInterviewStatus =
    dependencies.updateCandidateInterviewStatus ?? updateFeishuCandidateInterviewStatus;
  const now = dependencies.now ?? (() => new Date());
  const candidate = await getCandidate(input.candidateId);
  const busyTimes = await listBusyTimes(client, {
    endTime: input.endTime,
    startTime: input.startTime,
    userEmail: input.interviewerEmail
  });

  if (busyTimes.length > 0) {
    return {
      code: "TIME_CONFLICT",
      message: "面试官该时间段忙碌，请调整时间后重试。",
      success: false
    };
  }

  const calendarId = readRequiredEnv(env, "FEISHU_DEFAULT_CALENDAR_ID");
  const baseAppToken = readRequiredEnv(env, "FEISHU_BASE_APP_TOKEN");
  const candidateTableId = readRequiredEnv(env, "FEISHU_CANDIDATE_TABLE_ID");
  const { calendarEventId } = await createCalendarEvent(client, {
    calendarId,
    description: createCalendarDescription(candidate, input),
    endTime: input.endTime,
    startTime: input.startTime,
    summary: `面试：${candidate.fullName}｜${input.round}`
  });
  const bitableRecordId = input.candidateId;

  try {
    await updateCandidateInterviewStatus(client, {
      appToken: baseAppToken,
      calendarEventId,
      interviewerEmail: input.interviewerEmail,
      recordId: bitableRecordId,
      round: input.round,
      scheduledStartTime: input.startTime,
      syncStatus: "成功",
      syncedAt: now().toISOString(),
      status: "已预约面试",
      tableId: candidateTableId
    });
  } catch (error) {
    logger.error("Feishu bitable update failed after calendar event creation.", {
      calendarEventId,
      candidateId: input.candidateId,
      errorMessage: error instanceof Error ? error.message : "Unknown Feishu bitable error."
    });
    throw new ScheduleInterviewError(
      "FEISHU_SYNC_ERROR",
      error instanceof Error
        ? `飞书日程已创建，但多维表格更新失败：${error.message}`
        : "飞书日程已创建，但多维表格更新失败。"
    );
  }

  return {
    bitableRecordId,
    calendarEventId,
    candidateId: input.candidateId,
    success: true,
    syncStatus: "SUCCESS"
  };
}

function createDefaultFeishuClient(env: NodeJS.ProcessEnv): FeishuClient {
  const tokenProvider = new FeishuTenantAccessTokenProvider(
    createFeishuAuthConfigFromEnv(env)
  );

  return new FeishuClient({
    tokenProvider
  });
}

function validateScheduleInterviewInput(input: ScheduleInterviewInput): void {
  const requiredFields: Array<keyof ScheduleInterviewInput> = [
    "candidateId",
    "interviewerEmail",
    "startTime",
    "endTime",
    "round",
    "mode"
  ];

  for (const field of requiredFields) {
    if (!input[field].trim()) {
      throw new ScheduleInterviewError("VALIDATION_ERROR", `${field} is required.`);
    }
  }

  if (!input.interviewerEmail.includes("@")) {
    throw new ScheduleInterviewError("VALIDATION_ERROR", "interviewerEmail must be valid.");
  }

  const startMs = Date.parse(input.startTime);
  const endMs = Date.parse(input.endTime);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    throw new ScheduleInterviewError("VALIDATION_ERROR", "Interview time range is invalid.");
  }
}

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new ScheduleInterviewError("CONFIG_ERROR", `${key} is required.`);
  }

  return value;
}

function createCalendarDescription(
  candidate: CandidateDto,
  input: ScheduleInterviewInput
): string {
  return [
    "由 HR 在 hr-tool 中人工确认后创建。",
    `候选人：${candidate.fullName}`,
    `候选人 ID：${candidate.id}`,
    `面试轮次：${input.round}`,
    `面试形式：${input.mode}`,
    "不会自动通知候选人，不代表录用或拒绝。"
  ].join("\n");
}

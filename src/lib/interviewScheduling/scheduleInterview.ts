import { FeishuTenantAccessTokenProvider, createFeishuAuthConfigFromEnv } from "@/lib/feishu/feishuAuth";
import { updateFeishuCandidateInterviewStatus } from "@/lib/feishu/feishuBitable";
import { findFeishuBitableRecordMapping } from "@/lib/feishu/feishuBitableMapping";
import {
  createFeishuCalendarEvent,
  listFeishuBusyTimes
} from "@/lib/feishu/feishuCalendar";
import { FeishuClient } from "@/lib/feishu/feishuClient";
import {
  createInterviewScheduleSync,
  findInterviewScheduleSyncByIdempotencyKey,
  markInterviewScheduleCalendarCreated,
  markInterviewScheduleSyncBitableSynced,
  markInterviewScheduleSyncFailure
} from "@/lib/interviewScheduling/interviewScheduleSync";
import type { InterviewScheduleSyncRecord } from "@/lib/interviewScheduling/interviewScheduleSync";
import { logger } from "@/lib/logger";
import { candidateService } from "@/services/candidate.service";
import type { CandidateDto } from "@/types/candidate";

export type ScheduleInterviewInput = {
  idempotencyKey: string;
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
      scheduleSyncStatus: "BITABLE_SYNCED";
      syncId: string;
      deduplicated: boolean;
    }
  | {
      success: false;
      code: "TIME_CONFLICT" | "FEISHU_RECORD_MAPPING_NOT_FOUND" | "INVALID_IDEMPOTENCY_KEY";
      message: string;
    }
  | {
      success: false;
      code: "FEISHU_PARTIAL_SYNC_FAILED";
      message: string;
      candidateId: string;
      calendarEventId: string;
      bitableRecordId: string;
      syncId: string;
      syncStatus: "BITABLE_SYNC_FAILED";
      deduplicated: boolean;
    };

export type ScheduleInterviewDependencies = {
  getCandidate?: (candidateId: string) => Promise<CandidateDto>;
  listBusyTimes?: typeof listFeishuBusyTimes;
  createCalendarEvent?: typeof createFeishuCalendarEvent;
  findBitableRecordMapping?: typeof findFeishuBitableRecordMapping;
  findScheduleSyncByIdempotencyKey?: typeof findInterviewScheduleSyncByIdempotencyKey;
  createScheduleSync?: typeof createInterviewScheduleSync;
  markScheduleCalendarCreated?: typeof markInterviewScheduleCalendarCreated;
  markScheduleSyncBitableSynced?: typeof markInterviewScheduleSyncBitableSynced;
  markScheduleSyncFailure?: typeof markInterviewScheduleSyncFailure;
  updateCandidateInterviewStatus?: typeof updateFeishuCandidateInterviewStatus;
  client?: Pick<FeishuClient, "request">;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
};

export class ScheduleInterviewError extends Error {
  readonly code:
    | "VALIDATION_ERROR"
    | "CONFIG_ERROR"
    | "FEISHU_SYNC_ERROR"
    | "INVALID_IDEMPOTENCY_KEY";

  constructor(
    code:
      | "VALIDATION_ERROR"
      | "CONFIG_ERROR"
      | "FEISHU_SYNC_ERROR"
      | "INVALID_IDEMPOTENCY_KEY",
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
  const findBitableRecordMapping =
    dependencies.findBitableRecordMapping ?? findFeishuBitableRecordMapping;
  const findScheduleSyncByIdempotencyKey =
    dependencies.findScheduleSyncByIdempotencyKey ?? findInterviewScheduleSyncByIdempotencyKey;
  const createScheduleSync = dependencies.createScheduleSync ?? createInterviewScheduleSync;
  const markScheduleCalendarCreated =
    dependencies.markScheduleCalendarCreated ?? markInterviewScheduleCalendarCreated;
  const markScheduleSyncBitableSynced =
    dependencies.markScheduleSyncBitableSynced ?? markInterviewScheduleSyncBitableSynced;
  const markScheduleSyncFailure =
    dependencies.markScheduleSyncFailure ?? markInterviewScheduleSyncFailure;
  const updateCandidateInterviewStatus =
    dependencies.updateCandidateInterviewStatus ?? updateFeishuCandidateInterviewStatus;
  const now = dependencies.now ?? (() => new Date());
  const existingSync = await findScheduleSyncByIdempotencyKey(input.idempotencyKey);
  const existingResult = createExistingScheduleResult(existingSync);

  if (existingResult) {
    return existingResult;
  }

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
  const bitableRecordMapping = await findBitableRecordMapping({
    appToken: baseAppToken,
    candidateId: input.candidateId,
    tableId: candidateTableId
  });

  if (!bitableRecordMapping) {
    return {
      code: "FEISHU_RECORD_MAPPING_NOT_FOUND",
      message: "未找到候选人与飞书多维表格记录的映射，无法安排面试。",
      success: false
    };
  }

  const bitableRecordId = bitableRecordMapping.recordId;
  const scheduleSync =
    existingSync ??
    (await createScheduleSync({
      candidateId: input.candidateId,
      endTime: new Date(input.endTime),
      feishuAppToken: baseAppToken,
      feishuRecordId: bitableRecordId,
      feishuTableId: candidateTableId,
      idempotencyKey: input.idempotencyKey,
      interviewerEmail: input.interviewerEmail,
      round: input.round,
      startTime: new Date(input.startTime),
      status: "PENDING"
    }));
  const { calendarEventId } = await createCalendarEvent(client, {
    calendarId,
    description: createCalendarDescription(candidate, input),
    endTime: input.endTime,
    startTime: input.startTime,
    summary: `面试：${candidate.fullName}｜${input.round}`
  });
  await markScheduleCalendarCreated({
    calendarEventId,
    syncId: scheduleSync.id
  });

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
    await markScheduleSyncBitableSynced(scheduleSync.id);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Feishu bitable error.";
    logger.error("Feishu bitable update failed after calendar event creation.", {
      calendarEventId,
      candidateId: input.candidateId,
      errorMessage,
      syncId: scheduleSync.id
    });
    const failedSync = await markScheduleSyncFailure({
      errorCode: "FEISHU_SYNC_ERROR",
      errorMessage,
      status: "BITABLE_SYNC_FAILED",
      syncId: scheduleSync.id
    });

    return {
      bitableRecordId,
      calendarEventId,
      candidateId: input.candidateId,
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: false,
      message: "面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。",
      success: false,
      syncId: failedSync.id,
      syncStatus: "BITABLE_SYNC_FAILED"
    };
  }

  return {
    bitableRecordId,
    calendarEventId,
    candidateId: input.candidateId,
    deduplicated: false,
    scheduleSyncStatus: "BITABLE_SYNCED",
    success: true,
    syncId: scheduleSync.id,
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
    "idempotencyKey",
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

  if (!/^[a-zA-Z0-9:_-]{12,128}$/.test(input.idempotencyKey)) {
    throw new ScheduleInterviewError(
      "INVALID_IDEMPOTENCY_KEY",
      "idempotencyKey must be 12-128 URL-safe characters."
    );
  }

  const startMs = Date.parse(input.startTime);
  const endMs = Date.parse(input.endTime);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    throw new ScheduleInterviewError("VALIDATION_ERROR", "Interview time range is invalid.");
  }
}

function createExistingScheduleResult(
  sync: InterviewScheduleSyncRecord | null
): ScheduleInterviewResult | null {
  if (!sync?.calendarEventId) {
    return null;
  }

  if (sync.status === "BITABLE_SYNCED") {
    return {
      bitableRecordId: sync.feishuRecordId,
      calendarEventId: sync.calendarEventId,
      candidateId: sync.candidateId,
      deduplicated: true,
      scheduleSyncStatus: "BITABLE_SYNCED",
      success: true,
      syncId: sync.id,
      syncStatus: "SUCCESS"
    };
  }

  if (sync.status === "BITABLE_SYNC_FAILED") {
    return {
      bitableRecordId: sync.feishuRecordId,
      calendarEventId: sync.calendarEventId,
      candidateId: sync.candidateId,
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: true,
      message: "面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。",
      success: false,
      syncId: sync.id,
      syncStatus: "BITABLE_SYNC_FAILED"
    };
  }

  if (sync.status === "CALENDAR_CREATED") {
    return {
      bitableRecordId: sync.feishuRecordId,
      calendarEventId: sync.calendarEventId,
      candidateId: sync.candidateId,
      code: "FEISHU_PARTIAL_SYNC_FAILED",
      deduplicated: true,
      message: "面试日程已创建，表格同步状态仍在确认中。请不要重复预约，可稍后重试同步。",
      success: false,
      syncId: sync.id,
      syncStatus: "BITABLE_SYNC_FAILED"
    };
  }

  return null;
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

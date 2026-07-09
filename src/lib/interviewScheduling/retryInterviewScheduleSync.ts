import { FeishuTenantAccessTokenProvider, createFeishuAuthConfigFromEnv } from "@/lib/feishu/feishuAuth";
import { updateFeishuCandidateInterviewStatus } from "@/lib/feishu/feishuBitable";
import { FeishuClient } from "@/lib/feishu/feishuClient";
import {
  findInterviewScheduleSyncById,
  markInterviewScheduleSyncBitableSynced,
  markInterviewScheduleSyncFailure
} from "@/lib/interviewScheduling/interviewScheduleSync";

export type RetryInterviewScheduleSyncInput = {
  syncId: string;
};

export type RetryInterviewScheduleSyncResult =
  | {
      success: true;
      syncId: string;
      candidateId: string;
      calendarEventId: string;
      bitableRecordId: string;
      syncStatus: "BITABLE_SYNCED";
      retryCount: number;
    }
  | {
      success: false;
      code: "FEISHU_SYNC_RETRY_FAILED";
      message: string;
      syncId?: string;
      retryCount?: number;
    };

export type RetryInterviewScheduleSyncDependencies = {
  findSyncById?: typeof findInterviewScheduleSyncById;
  markBitableSynced?: typeof markInterviewScheduleSyncBitableSynced;
  markSyncFailure?: typeof markInterviewScheduleSyncFailure;
  updateCandidateInterviewStatus?: typeof updateFeishuCandidateInterviewStatus;
  client?: Pick<FeishuClient, "request">;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
};

export async function retryInterviewScheduleSync(
  input: RetryInterviewScheduleSyncInput,
  dependencies: RetryInterviewScheduleSyncDependencies = {}
): Promise<RetryInterviewScheduleSyncResult> {
  if (!input.syncId.trim()) {
    return {
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: "syncId is required.",
      success: false
    };
  }

  const findSyncById = dependencies.findSyncById ?? findInterviewScheduleSyncById;
  const sync = await findSyncById(input.syncId);

  if (!sync) {
    return {
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: "未找到面试预约同步记录，无法重试。",
      success: false,
      syncId: input.syncId
    };
  }

  if (!sync.calendarEventId) {
    return {
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: "面试日程尚未创建，不能重试表格同步。",
      success: false,
      syncId: sync.id,
      retryCount: sync.retryCount
    };
  }

  const env = dependencies.env ?? process.env;
  const client = dependencies.client ?? createDefaultFeishuClient(env);
  const updateCandidateInterviewStatus =
    dependencies.updateCandidateInterviewStatus ?? updateFeishuCandidateInterviewStatus;
  const markBitableSynced =
    dependencies.markBitableSynced ?? markInterviewScheduleSyncBitableSynced;
  const markSyncFailure = dependencies.markSyncFailure ?? markInterviewScheduleSyncFailure;
  const now = dependencies.now ?? (() => new Date());

  try {
    await updateCandidateInterviewStatus(client, {
      appToken: sync.feishuAppToken,
      calendarEventId: sync.calendarEventId,
      interviewerEmail: sync.interviewerEmail,
      recordId: sync.feishuRecordId,
      round: sync.round,
      scheduledStartTime: sync.startTime.toISOString(),
      syncStatus: "成功",
      syncedAt: now().toISOString(),
      status: "已预约面试",
      tableId: sync.feishuTableId
    });

    const updatedSync = await markBitableSynced(sync.id);

    return {
      bitableRecordId: updatedSync.feishuRecordId,
      calendarEventId: sync.calendarEventId,
      candidateId: updatedSync.candidateId,
      retryCount: updatedSync.retryCount,
      success: true,
      syncId: updatedSync.id,
      syncStatus: "BITABLE_SYNCED"
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Feishu bitable retry error.";
    const failedSync = await markSyncFailure({
      errorCode: "FEISHU_SYNC_RETRY_FAILED",
      errorMessage,
      incrementRetryCount: true,
      status: "BITABLE_SYNC_FAILED",
      syncId: sync.id
    });

    return {
      code: "FEISHU_SYNC_RETRY_FAILED",
      message: `飞书表格重试同步失败：${errorMessage}`,
      retryCount: failedSync.retryCount,
      success: false,
      syncId: failedSync.id
    };
  }
}

function createDefaultFeishuClient(env: NodeJS.ProcessEnv): FeishuClient {
  const tokenProvider = new FeishuTenantAccessTokenProvider(
    createFeishuAuthConfigFromEnv(env)
  );

  return new FeishuClient({
    tokenProvider
  });
}

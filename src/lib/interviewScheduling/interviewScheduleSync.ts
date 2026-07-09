import { prisma } from "@/lib/prisma";

export type InterviewScheduleSyncStatus =
  | "PENDING"
  | "CALENDAR_CREATED"
  | "BITABLE_SYNCED"
  | "BITABLE_SYNC_FAILED"
  | "FAILED";

export type InterviewScheduleSyncRecord = {
  id: string;
  candidateId: string;
  calendarEventId: string | null;
  feishuAppToken: string;
  feishuTableId: string;
  feishuRecordId: string;
  interviewerEmail: string;
  round: string;
  startTime: Date;
  endTime: Date;
  status: InterviewScheduleSyncStatus;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateInterviewScheduleSyncInput = {
  candidateId: string;
  calendarEventId: string;
  feishuAppToken: string;
  feishuTableId: string;
  feishuRecordId: string;
  interviewerEmail: string;
  round: string;
  startTime: Date;
  endTime: Date;
  status?: InterviewScheduleSyncStatus;
};

export type MarkInterviewScheduleSyncFailureInput = {
  syncId: string;
  status?: Extract<InterviewScheduleSyncStatus, "BITABLE_SYNC_FAILED" | "FAILED">;
  errorCode: string;
  errorMessage: string;
  incrementRetryCount?: boolean;
};

export async function createInterviewScheduleSync(
  input: CreateInterviewScheduleSyncInput
): Promise<InterviewScheduleSyncRecord> {
  return prisma.interviewScheduleSync.create({
    data: {
      calendarEventId: input.calendarEventId,
      candidateId: input.candidateId,
      endTime: input.endTime,
      feishuAppToken: input.feishuAppToken,
      feishuRecordId: input.feishuRecordId,
      feishuTableId: input.feishuTableId,
      interviewerEmail: input.interviewerEmail,
      round: input.round,
      startTime: input.startTime,
      status: input.status ?? "CALENDAR_CREATED"
    }
  });
}

export async function markInterviewScheduleSyncBitableSynced(
  syncId: string
): Promise<InterviewScheduleSyncRecord> {
  return prisma.interviewScheduleSync.update({
    data: {
      lastErrorCode: null,
      lastErrorMessage: null,
      status: "BITABLE_SYNCED"
    },
    where: {
      id: syncId
    }
  });
}

export async function markInterviewScheduleSyncFailure(
  input: MarkInterviewScheduleSyncFailureInput
): Promise<InterviewScheduleSyncRecord> {
  return prisma.interviewScheduleSync.update({
    data: {
      lastErrorCode: input.errorCode,
      lastErrorMessage: input.errorMessage,
      retryCount: input.incrementRetryCount ? { increment: 1 } : undefined,
      status: input.status ?? "BITABLE_SYNC_FAILED"
    },
    where: {
      id: input.syncId
    }
  });
}

export async function findInterviewScheduleSyncById(
  syncId: string
): Promise<InterviewScheduleSyncRecord | null> {
  return prisma.interviewScheduleSync.findUnique({
    where: {
      id: syncId
    }
  });
}

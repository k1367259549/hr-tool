import { prisma } from "@/lib/prisma";

export type InterviewScheduleSyncStatus =
  | "PENDING"
  | "CALENDAR_CREATED"
  | "BITABLE_SYNCED"
  | "BITABLE_SYNC_FAILED"
  | "FAILED";

export type InterviewScheduleSyncRecord = {
  id: string;
  idempotencyKey: string | null;
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
  idempotencyKey?: string | null;
  candidateId: string;
  calendarEventId?: string | null;
  feishuAppToken: string;
  feishuTableId: string;
  feishuRecordId: string;
  interviewerEmail: string;
  round: string;
  startTime: Date;
  endTime: Date;
  status?: InterviewScheduleSyncStatus;
};

export type MarkInterviewScheduleCalendarCreatedInput = {
  syncId: string;
  calendarEventId: string;
};

export type MarkInterviewScheduleSyncFailureInput = {
  syncId: string;
  status?: Extract<InterviewScheduleSyncStatus, "BITABLE_SYNC_FAILED" | "FAILED">;
  errorCode: string;
  errorMessage: string;
  incrementRetryCount?: boolean;
};

export type InterviewScheduleSyncHistoryItem = {
  syncId: string;
  candidateId: string;
  calendarEventId: string | null;
  bitableRecordId: string | null;
  status: InterviewScheduleSyncStatus;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListInterviewScheduleSyncsDependencies = {
  findMany?: (query: {
    where: {
      candidateId: string;
    };
    orderBy: {
      createdAt: "desc";
    };
  }) => Promise<InterviewScheduleSyncRecord[]>;
};

export async function createInterviewScheduleSync(
  input: CreateInterviewScheduleSyncInput
): Promise<InterviewScheduleSyncRecord> {
  return prisma.interviewScheduleSync.create({
    data: {
      calendarEventId: input.calendarEventId ?? null,
      candidateId: input.candidateId,
      endTime: input.endTime,
      feishuAppToken: input.feishuAppToken,
      feishuRecordId: input.feishuRecordId,
      feishuTableId: input.feishuTableId,
      idempotencyKey: input.idempotencyKey ?? null,
      interviewerEmail: input.interviewerEmail,
      round: input.round,
      startTime: input.startTime,
      status: input.status ?? "CALENDAR_CREATED"
    }
  });
}

export async function markInterviewScheduleCalendarCreated(
  input: MarkInterviewScheduleCalendarCreatedInput
): Promise<InterviewScheduleSyncRecord> {
  return prisma.interviewScheduleSync.update({
    data: {
      calendarEventId: input.calendarEventId,
      status: "CALENDAR_CREATED"
    },
    where: {
      id: input.syncId
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

export async function findInterviewScheduleSyncByIdempotencyKey(
  idempotencyKey: string
): Promise<InterviewScheduleSyncRecord | null> {
  return prisma.interviewScheduleSync.findUnique({
    where: {
      idempotencyKey
    }
  });
}

export async function listInterviewScheduleSyncsByCandidate(
  candidateId: string,
  dependencies: ListInterviewScheduleSyncsDependencies = {}
): Promise<InterviewScheduleSyncHistoryItem[]> {
  const normalizedCandidateId = candidateId.trim();

  if (!normalizedCandidateId) {
    return [];
  }

  const findMany =
    dependencies.findMany ??
    ((query) => prisma.interviewScheduleSync.findMany(query));
  const records = await findMany({
    orderBy: {
      createdAt: "desc"
    },
    where: {
      candidateId: normalizedCandidateId
    }
  });

  return records.map(toInterviewScheduleSyncHistoryItem);
}

export function toInterviewScheduleSyncHistoryItem(
  record: InterviewScheduleSyncRecord
): InterviewScheduleSyncHistoryItem {
  return {
    bitableRecordId: record.feishuRecordId,
    calendarEventId: record.calendarEventId,
    candidateId: record.candidateId,
    createdAt: record.createdAt.toISOString(),
    errorCode: record.lastErrorCode,
    errorMessage: record.lastErrorMessage,
    status: record.status,
    syncId: record.id,
    updatedAt: record.updatedAt.toISOString()
  };
}

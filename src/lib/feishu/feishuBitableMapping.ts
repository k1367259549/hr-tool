import { prisma } from "@/lib/prisma";

export type FeishuBitableRecordMapping = {
  id: string;
  candidateId: string;
  appToken: string;
  tableId: string;
  recordId: string;
  syncStatus: string | null;
  lastSyncedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FindFeishuBitableRecordMappingInput = {
  candidateId: string;
  appToken: string;
  tableId: string;
};

export async function findFeishuBitableRecordMapping(
  input: FindFeishuBitableRecordMappingInput
): Promise<FeishuBitableRecordMapping | null> {
  return prisma.feishuBitableRecordMapping.findUnique({
    where: {
      feishuBitableCandidateTableMapping: {
        appToken: input.appToken,
        candidateId: input.candidateId,
        tableId: input.tableId
      }
    }
  });
}

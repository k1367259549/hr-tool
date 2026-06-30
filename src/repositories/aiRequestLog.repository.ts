import { prisma } from "@/lib/prisma";
import type { AIRequestLog, AIRequestLogCreateInput } from "@/types/audit";

export const aiRequestLogRepository = {
  async create(data: AIRequestLogCreateInput): Promise<AIRequestLog> {
    return prisma.aIRequestLog.create({
      data
    });
  }
};

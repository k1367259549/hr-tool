import { logger } from "@/lib/logger";
import { aiRequestLogRepository } from "@/repositories/aiRequestLog.repository";
import type { AIRequestAuditInput, AIRequestLog } from "@/types/audit";

export const auditService = {
  async logAIRequest(input: AIRequestAuditInput): Promise<AIRequestLog | null> {
    try {
      const auditLog = await aiRequestLogRepository.create(input);

      logger.info("AI request audit recorded.", {
        feature: input.feature,
        latencyMs: input.latencyMs,
        model: input.model,
        success: input.success,
        totalTokens: input.totalTokens
      });

      return auditLog;
    } catch (error) {
      logger.error("Failed to record AI request audit.", {
        errorMessage: getErrorMessage(error),
        feature: input.feature,
        model: input.model,
        success: input.success
      });

      return null;
    }
  }
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error.";
}

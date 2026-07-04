import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import type {
  ResumeEvaluationRunDto,
  ResumeEvaluationRunSafeRecord
} from "@/types/resumeEvaluationRun";

export class ResumeEvaluationRunServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "ResumeEvaluationRunServiceError";
    this.code = code;
  }
}

export const resumeEvaluationRunService = {
  async createMockEvaluationRun(evaluationId: string): Promise<ResumeEvaluationRunDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const evaluation = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!evaluation) {
          throw new ResumeEvaluationRunServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (!evaluation.resumeRevisionId || !evaluation.parsedSnapshotId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "评估记录缺少实际使用的简历修订版本或解析快照，不能创建 run。"
          );
        }

        const revision = await resumeRevisionRepository.findRevisionWithSnapshotById(
          evaluation.resumeRevisionId,
          tx
        );

        if (!revision || revision.resumeId !== evaluation.resumeId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "简历修订版本不属于当前评估简历。"
          );
        }

        if (revision.parsedSnapshot?.id !== evaluation.parsedSnapshotId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "解析快照不属于当前评估简历修订版本。"
          );
        }

        const run = await resumeEvaluationRunRepository.createRun(
          {
            completedAt: new Date(),
            evaluationId: evaluation.id,
            jobProfileId: evaluation.jobProfileId,
            jobProfileVersion: evaluation.jobProfileVersion,
            parsedOutputJson: createMockParsedOutput(),
            parsedSnapshotId: evaluation.parsedSnapshotId,
            resumeId: evaluation.resumeId,
            resumeRevisionId: evaluation.resumeRevisionId,
            runType: "MOCK",
            status: "SUCCEEDED",
            templateVersionId: evaluation.templateVersionId
          },
          tx
        );

        return toDto(run);
      });
    } catch (error) {
      throw normalizeError(error, "创建评估 run 失败。");
    }
  },

  async listRunsByEvaluationId(evaluationId: string): Promise<ResumeEvaluationRunDto[]> {
    try {
      const runs = await resumeEvaluationRunRepository.listRunsByEvaluationId(evaluationId);

      return runs.map(toDto);
    } catch (error) {
      throw normalizeError(error, "查询评估 run 列表失败。");
    }
  },

  async getLatestSuccessfulRunByEvaluationId(
    evaluationId: string
  ): Promise<ResumeEvaluationRunDto | null> {
    try {
      const run = await resumeEvaluationRunRepository.findLatestSuccessfulRun(evaluationId);

      return run ? toDto(run) : null;
    } catch (error) {
      throw normalizeError(error, "查询最新成功评估 run 失败。");
    }
  },

  async getLatestSuccessfulRun(evaluationId: string): Promise<ResumeEvaluationRunDto | null> {
    return this.getLatestSuccessfulRunByEvaluationId(evaluationId);
  }
};

function createMockParsedOutput(): Prisma.InputJsonObject {
  return {
    schemaVersion: "m07-b2-b-mock-v1",
    status: "MOCK_EVALUATION_RUN_CREATED"
  };
}

function toDto(run: ResumeEvaluationRunSafeRecord): ResumeEvaluationRunDto {
  return {
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    evaluationId: run.evaluationId,
    id: run.id,
    modelName: run.modelName,
    modelProvider: run.modelProvider,
    parsedSnapshotId: run.parsedSnapshotId,
    promptVersion: run.promptVersion,
    rating: run.rating,
    resumeRevisionId: run.resumeRevisionId,
    runType: run.runType,
    score: run.score,
    status: run.status,
    summary: run.summary
  };
}

function normalizeError(
  error: unknown,
  fallbackMessage: string
): ResumeEvaluationRunServiceError {
  if (error instanceof ResumeEvaluationRunServiceError) {
    return error;
  }

  return new ResumeEvaluationRunServiceError("DATABASE_ERROR", fallbackMessage);
}

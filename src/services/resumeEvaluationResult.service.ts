import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
import { jobProfileEvaluationAssignmentRepository } from "@/repositories/jobProfileEvaluationAssignment.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import {
  createDetailedAnalysisReviewAuditFields,
  parseDetailedAnalysisReviewAudit
} from "@/lib/resume-screening/detailed-analysis-review";
import { DetailedScreeningResultSchema } from "@/lib/resume-screening/schema";
import type {
  EvaluationCriterion
} from "@/types/evaluationTemplate";
import type {
  ResumeEvaluationCreateInput,
  ResumeEvaluationDetailDto,
  ResumeEvaluationEventDto,
  ResumeEvaluationListQuery,
  ResumeEvaluationListResultDto,
  ResumeEvaluationOptionsDto,
  ResumeEvaluationReopenInput,
  ResumeEvaluationResultDetailRecord,
  ResumeEvaluationReviewInput,
  ResumeEvaluationSubmitReviewInput,
  ResumeEvaluationSummaryDto,
  ResumeEvaluationUpdateInput,
  ResumeCriterionResult,
  ResumeEvaluationCriterionResultDto
} from "@/types/resumeEvaluationResult";
import type { DetailedAnalysisReviewInput } from "@/types/resumeEvaluationRun";
import {
  EvaluationTemplateValidationError,
  parseEvaluationCriteriaJson
} from "@/utils/evaluationTemplateValidation";

const resumeEvaluationContextFields = [
  "resumeId",
  "jobProfileId",
  "templateVersionId",
  "jobProfileVersion"
] as const;
const reviewerDecisions = ["PASS", "REJECT", "HOLD", "NEEDS_MORE_INFO"] as const;

export class ResumeEvaluationResultServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "ResumeEvaluationResultServiceError";
    this.code = code;
  }
}

export const resumeEvaluationResultService = {
  async createEvaluation(
    input: ResumeEvaluationCreateInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const resume = await candidateResumeRepository.findById(input.resumeId);

        if (!resume) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "简历不存在。");
        }

        if (resume.parsingStatus !== "PARSED") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只能对已解析完成的简历创建评估。"
          );
        }

        const jobProfile = await jobProfileRepository.findById(input.jobProfileId, tx);

        if (!jobProfile) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "岗位画像不存在。");
        }

        if (!jobProfile.reviewedAt) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只能对已人工确认的岗位画像创建评估。"
          );
        }

        const activeAssignment =
          await jobProfileEvaluationAssignmentRepository.findActiveAssignment(
            input.jobProfileId,
            tx
          );

        if (!activeAssignment) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "该岗位尚未分配评价标准，请先分配后再创建评估。"
          );
        }

        if (activeAssignment.templateVersionId !== input.templateVersionId) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "指定的模板版本与岗位当前活跃分配不匹配。"
          );
        }

        const templateVersion = await evaluationTemplateRepository.findVersionById(
          input.templateVersionId,
          tx
        );

        if (!templateVersion) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评价标准版本不存在。");
        }

        if (templateVersion.status !== "PUBLISHED") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只能使用已发布的评价标准版本创建评估。"
          );
        }

        if (templateVersion.template.status !== "ACTIVE") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "对应评价标准已归档，不能创建新评估。"
          );
        }

        const jobProfileVersion = jobProfile.updatedAt.toISOString();

        const templateCriteria = parseTemplateCriteria(templateVersion.criteria);
        const initialCriterionResults = templateCriteria.map((criterion) => ({
          assessment: "NOT_ASSESSED" as const,
          criterionKey: criterion.key,
          evidenceNotes: []
        }));
        const revisionContext = await resolveEvaluationRevisionContext(input, tx);
        const createInput: ResumeEvaluationCreateInput = {
          ...input,
          parsedSnapshotId: revisionContext.parsedSnapshotId,
          resumeRevisionId: revisionContext.resumeRevisionId
        };

        const evaluation = await resumeEvaluationRepository.createWithEvent(
          createInput,
          jobProfileVersion,
          initialCriterionResults,
          input.evaluatedBy ?? null,
          tx
        );

        return toDetailDto(evaluation);
      });
    } catch (error) {
      throw normalizeError(error, "创建评估失败。");
    }
  },

  async listEvaluations(
    query: ResumeEvaluationListQuery
  ): Promise<ResumeEvaluationListResultDto> {
    try {
      const result = await resumeEvaluationRepository.list(query);

      return {
        items: result.evaluations.map(toSummaryDto),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / query.pageSize))
        }
      };
    } catch (error) {
      throw normalizeError(error, "查询评估列表失败。");
    }
  },

  async getEvaluation(id: string): Promise<ResumeEvaluationDetailDto> {
    try {
      const evaluation = await resumeEvaluationRepository.findDetailById(id);

      if (!evaluation) {
        throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
      }

      return toDetailDto(evaluation);
    } catch (error) {
      throw normalizeError(error, "读取评估失败。");
    }
  },

  async updateDraftEvaluation(
    id: string,
    input: ResumeEvaluationUpdateInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!existing) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (existing.status !== "DRAFT") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只有 DRAFT 状态的评估可以更新。"
          );
        }

        if (existing.revision !== input.expectedRevision) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估已被其他操作修改，请刷新后重试。"
          );
        }

        const normalizedInput: ResumeEvaluationUpdateInput = {
          ...input,
          criterionResults:
            input.criterionResults === undefined
              ? undefined
              : await normalizeCriterionResultsForEvaluation(existing, input.criterionResults, tx)
        };

        const changedFields = computeChangedFields(existing, normalizedInput);

        if (changedFields.length === 0) {
          return toDetailDto(existing);
        }

        const updatedCount = await resumeEvaluationRepository.updateDraftWithEvent(
          id,
          normalizedInput.expectedRevision,
          normalizedInput.criterionResults,
          normalizedInput.overallNote,
          normalizedInput.evaluatedBy,
          changedFields,
          normalizedInput.evaluatedBy ?? null,
          tx
        );

        if (updatedCount === 0) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估状态已变化，请刷新后重试。"
          );
        }

        const updated = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError("DATABASE_ERROR", "更新评估后读取失败。");
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "更新评估失败。");
    }
  },

  async reviewEvaluation(
    id: string,
    input: ResumeEvaluationReviewInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!existing) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (existing.status !== "DRAFT") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只有 DRAFT 状态的评估可以标记为已审阅。"
          );
        }

        if (existing.revision !== input.expectedRevision) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估已被其他操作修改，请刷新后重试。"
          );
        }

        await assertEvaluationReviewable(existing, tx);

        const updatedCount = await resumeEvaluationRepository.reviewWithEvent(
          id,
          input.expectedRevision,
          new Date(),
          input.actor ?? null,
          tx
        );

        if (updatedCount === 0) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估状态已变化，请刷新后重试。"
          );
        }

        const updated = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError("DATABASE_ERROR", "标记审阅后读取失败。");
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "标记评估审阅失败。");
    }
  },

  async reopenEvaluation(
    id: string,
    input: ResumeEvaluationReopenInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!existing) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (existing.status !== "REVIEWED") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "只有 REVIEWED 状态的评估可以重新开放。"
          );
        }

        const updatedCount = await resumeEvaluationRepository.reopenWithEvent(
          id,
          input.expectedRevision,
          input.actor ?? null,
          input.note,
          tx
        );

        if (updatedCount === 0) {
          await classifyReopenFailure(id, input.expectedRevision, tx);
        }

        const updated = await resumeEvaluationRepository.findDetailById(id, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError("DATABASE_ERROR", "重新开放评估后读取失败。");
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "重新开放评估失败。");
    }
  },

  async selectRunForReview(
    evaluationId: string,
    selectedRunId: string | null
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const evaluation = await resumeEvaluationRepository.findEvaluationForSelectedRunUpdate(
          evaluationId,
          tx
        );

        if (!evaluation) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (selectedRunId !== null) {
          const run = await resumeEvaluationRunRepository.findRunForSelection(
            selectedRunId,
            tx
          );

          if (!run) {
            throw new ResumeEvaluationResultServiceError(
              "NOT_FOUND",
              "选择的评估 run 不存在。"
            );
          }

          assertRunSelectableForEvaluation(evaluation, run);
        }

        await resumeEvaluationRepository.updateSelectedRun(evaluationId, selectedRunId, tx);

        const updated = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError(
            "DATABASE_ERROR",
            "更新 selectedRunId 后读取失败。"
          );
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "更新 selectedRunId 失败。");
    }
  },

  async reviewDetailedAnalysisRun(
    evaluationId: string,
    runId: string,
    input: DetailedAnalysisReviewInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        if (!isDetailedAnalysisReviewAction(input.decision)) {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "详细分析审核 decision 参数无效。"
          );
        }

        const reviewer = input.reviewer?.trim();

        if (!reviewer) {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "reviewer 不能为空。"
          );
        }

        const evaluation = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!evaluation) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (evaluation.status === "REVIEWED") {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "人工评估已审阅，请先重新开放人工评估后再更换详细分析参考。"
          );
        }

        if (evaluation.revision !== input.expectedRevision) {
          const duplicate = findLatestDetailedAnalysisReview(evaluation.events, runId);

          if (isIdempotentDetailedAnalysisReview(evaluation, duplicate, input)) {
            return toDetailDto(evaluation);
          }

          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估已被其他操作修改，请刷新后再提交详细分析审核。"
          );
        }

        const run = await resumeEvaluationRunRepository.findRunForSelection(runId, tx);

        if (!run) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "详细分析 run 不存在。");
        }

        assertRunSelectableForEvaluation(evaluation, run);

        const detailedRun = await resumeEvaluationRunRepository.findRunById(runId, tx);

        if (!detailedRun || detailedRun.runType !== "AI") {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "只有 Detailed Analysis run 可以进入此审核流程。"
          );
        }

        if (!DetailedScreeningResultSchema.safeParse(detailedRun.parsedOutputJson).success) {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "详细分析结果格式不完整，请重新运行详细分析。"
          );
        }

        const note = input.note?.trim() || null;

        if (
          (input.decision === "NEEDS_REVISION" || input.decision === "REJECTED") &&
          !note
        ) {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "要求重新分析或拒绝结果时必须填写审核说明。"
          );
        }

        const becameReference = input.decision === "ACCEPTED_AS_REFERENCE";
        const updatedCount = await resumeEvaluationRepository.recordDetailedAnalysisReview(
          evaluationId,
          input.expectedRevision,
          {
            auditFields: createDetailedAnalysisReviewAuditFields(
              runId,
              input.decision,
              becameReference
            ),
            note,
            reviewer,
            selectedRunId: becameReference ? runId : undefined
          },
          tx
        );

        if (updatedCount === 0) {
          throw new ResumeEvaluationResultServiceError(
            "CONFLICT",
            "评估已被其他操作修改，请刷新后再提交详细分析审核。"
          );
        }

        const updated = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError(
            "DATABASE_ERROR",
            "记录详细分析审核后读取失败。"
          );
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "提交详细分析审核失败。");
    }
  },

  async submitReview(
    evaluationId: string,
    input: ResumeEvaluationSubmitReviewInput
  ): Promise<ResumeEvaluationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const evaluation = await resumeEvaluationRepository.findEvaluationForReview(
          evaluationId,
          tx
        );

        if (!evaluation) {
          throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
        }

        const manualReviewWithoutRunBasis = input.manualReviewWithoutRunBasis ?? false;
        const reviewerNotes = input.reviewerNotes ?? null;
        let reviewedRunId: string | null = null;

        if (!reviewerDecisions.includes(input.reviewerDecision)) {
          throw new ResumeEvaluationResultServiceError(
            "VALIDATION_ERROR",
            "reviewerDecision 参数无效。"
          );
        }

        if (evaluation.selectedRunId) {
          const selectedRun = await resumeEvaluationRunRepository.findRunForSelection(
            evaluation.selectedRunId,
            tx
          );

          if (!selectedRun) {
            throw new ResumeEvaluationResultServiceError(
              "NOT_FOUND",
              "当前 selectedRunId 指向的评估 run 不存在。"
            );
          }

          assertRunSelectableForEvaluation(evaluation, selectedRun);
          reviewedRunId = evaluation.selectedRunId;
        } else {
          if (!manualReviewWithoutRunBasis) {
            throw new ResumeEvaluationResultServiceError(
              "VALIDATION_ERROR",
              "提交 HR review 前必须先选择一个 SUCCEEDED run，或显式启用 manualReviewWithoutRunBasis。"
            );
          }

          if (!reviewerNotes?.trim()) {
            throw new ResumeEvaluationResultServiceError(
              "VALIDATION_ERROR",
              "manualReviewWithoutRunBasis = true 时 reviewerNotes 为必填项。"
            );
          }
        }

        await resumeEvaluationRepository.updateReview(
          evaluationId,
          {
            reviewedAt: new Date(),
            reviewedBy: input.actor ?? null,
            reviewedRunId,
            reviewerDecision: input.reviewerDecision,
            reviewerNotes
          },
          tx
        );

        const updated = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!updated) {
          throw new ResumeEvaluationResultServiceError(
            "DATABASE_ERROR",
            "提交 HR review 后读取失败。"
          );
        }

        return toDetailDto(updated);
      });
    } catch (error) {
      throw normalizeError(error, "提交 HR review 失败。");
    }
  },

  async getEvaluationOptions(resumeId: string): Promise<ResumeEvaluationOptionsDto> {
    try {
      const options = await resumeEvaluationRepository.listEvaluationOptions(resumeId);

      return {
        jobProfiles: options.jobProfiles.map((jp) => ({
          id: jp.id,
          jobTitle: jp.jobTitle,
          reviewedAt: jp.reviewedAt?.toISOString() ?? null
        })),
        templateVersions: options.templateVersions.map((tv) => ({
          id: tv.id,
          status: tv.status,
          templateId: tv.template.id,
          templateName: tv.template.name,
          versionNumber: tv.versionNumber
        }))
      };
    } catch (error) {
      throw normalizeError(error, "读取评估选项失败。");
    }
  }
};

function toSummaryDto(
  evaluation: ResumeEvaluationResultDetailRecord | {
    id: string;
    resumeId: string;
    resumeRevisionId?: string | null;
    parsedSnapshotId?: string | null;
    jobProfileId: string;
    templateVersionId: string;
    jobProfileVersion: string;
    status: "DRAFT" | "REVIEWED";
    revision: number;
    overallNote: string | null;
    evaluatedBy: string | null;
    reviewedRunId?: string | null;
    reviewerDecision?: ResumeEvaluationSummaryDto["reviewerDecision"];
    reviewerNotes?: string | null;
    reviewedAt: Date | null;
    reviewedBy?: string | null;
    selectedRunId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
): ResumeEvaluationSummaryDto {
  return {
    createdAt: evaluation.createdAt.toISOString(),
    evaluatedBy: evaluation.evaluatedBy,
    id: evaluation.id,
    jobProfileId: evaluation.jobProfileId,
    jobProfileVersion: evaluation.jobProfileVersion,
    overallNote: evaluation.overallNote,
    parsedSnapshotId: evaluation.parsedSnapshotId ?? null,
    resumeId: evaluation.resumeId,
    resumeRevisionId: evaluation.resumeRevisionId ?? null,
    reviewedAt: evaluation.reviewedAt?.toISOString() ?? null,
    reviewedBy: evaluation.reviewedBy ?? null,
    reviewedRunId: evaluation.reviewedRunId ?? null,
    reviewerDecision: evaluation.reviewerDecision ?? null,
    reviewerNotes: evaluation.reviewerNotes ?? null,
    revision: evaluation.revision,
    selectedRunId: evaluation.selectedRunId ?? null,
    status: evaluation.status,
    templateVersionId: evaluation.templateVersionId,
    updatedAt: evaluation.updatedAt.toISOString()
  };
}

function assertRunSelectableForEvaluation(
  evaluation: {
    id: string;
    resumeId: string;
    jobProfileId: string;
    templateVersionId: string;
    jobProfileVersion: string;
  },
  run: {
    evaluationId: string;
    status: "PENDING" | "SUCCEEDED" | "FAILED";
    resumeId: string;
    jobProfileId: string;
    templateVersionId: string;
    jobProfileVersion: string;
  }
): void {
  if (run.evaluationId !== evaluation.id) {
    throw new ResumeEvaluationResultServiceError(
      "VALIDATION_ERROR",
      "选择的评估 run 不属于当前评估。"
    );
  }

  if (run.status !== "SUCCEEDED") {
    throw new ResumeEvaluationResultServiceError(
      "VALIDATION_ERROR",
      "只能选择 SUCCEEDED 状态的评估 run。"
    );
  }

  if (
    run.resumeId !== evaluation.resumeId ||
    run.jobProfileId !== evaluation.jobProfileId ||
    run.templateVersionId !== evaluation.templateVersionId ||
    run.jobProfileVersion !== evaluation.jobProfileVersion
  ) {
    throw new ResumeEvaluationResultServiceError(
      "VALIDATION_ERROR",
      "选择的评估 run 与当前评估上下文不匹配。"
    );
  }
}

function findLatestDetailedAnalysisReview(
  events: ResumeEvaluationResultDetailRecord["events"],
  runId: string
) {
  for (const event of events) {
    const audit = parseDetailedAnalysisReviewAudit(event);

    if (audit?.runId === runId) {
      return { audit, event };
    }
  }

  return null;
}

function isIdempotentDetailedAnalysisReview(
  evaluation: ResumeEvaluationResultDetailRecord,
  existing: ReturnType<typeof findLatestDetailedAnalysisReview>,
  input: DetailedAnalysisReviewInput
): boolean {
  if (!existing || existing.audit.decision !== input.decision) {
    return false;
  }

  if (existing.event.actor !== input.reviewer?.trim()) {
    return false;
  }

  if ((existing.event.note ?? null) !== (input.note?.trim() || null)) {
    return false;
  }

  return input.decision !== "ACCEPTED_AS_REFERENCE" || evaluation.selectedRunId === existing.audit.runId;
}

function isDetailedAnalysisReviewAction(value: unknown): value is DetailedAnalysisReviewInput["decision"] {
  return (
    value === "ACCEPTED_AS_REFERENCE" ||
    value === "NEEDS_REVISION" ||
    value === "REJECTED"
  );
}

async function resolveEvaluationRevisionContext(
  input: ResumeEvaluationCreateInput,
  client: Parameters<typeof resumeRevisionRepository.findLatestRevisionWithSnapshot>[1]
): Promise<{
  resumeRevisionId: string | null;
  parsedSnapshotId: string | null;
}> {
  if (input.resumeRevisionId && input.parsedSnapshotId) {
    const snapshot = await resumeRevisionRepository.findSnapshotWithRevisionById(
      input.parsedSnapshotId,
      client
    );

    if (!snapshot || snapshot.revisionId !== input.resumeRevisionId) {
      throw new ResumeEvaluationResultServiceError(
        "VALIDATION_ERROR",
        "解析快照与简历修订版本不匹配。"
      );
    }

    return {
      parsedSnapshotId: input.parsedSnapshotId,
      resumeRevisionId: input.resumeRevisionId
    };
  }

  if (input.resumeRevisionId) {
    const revision = await resumeRevisionRepository.findRevisionWithSnapshotById(
      input.resumeRevisionId,
      client
    );

    if (!revision) {
      throw new ResumeEvaluationResultServiceError(
        "VALIDATION_ERROR",
        "指定的简历修订版本不存在。"
      );
    }

    return {
      parsedSnapshotId: revision.parsedSnapshot?.id ?? null,
      resumeRevisionId: revision.id
    };
  }

  if (input.parsedSnapshotId) {
    const snapshot = await resumeRevisionRepository.findSnapshotWithRevisionById(
      input.parsedSnapshotId,
      client
    );

    if (!snapshot) {
      throw new ResumeEvaluationResultServiceError(
        "VALIDATION_ERROR",
        "指定的解析快照不存在。"
      );
    }

    return {
      parsedSnapshotId: snapshot.id,
      resumeRevisionId: snapshot.revisionId
    };
  }

  const latestRevision = await resumeRevisionRepository.findLatestRevisionWithSnapshot(
    input.resumeId,
    client
  );

  return {
    // Historical resumes may predate M06 revision backfill, so new evaluations stay compatible.
    parsedSnapshotId: input.parsedSnapshotId ?? latestRevision?.parsedSnapshot?.id ?? null,
    resumeRevisionId: input.resumeRevisionId ?? latestRevision?.id ?? null
  };
}

async function normalizeCriterionResultsForEvaluation(
  evaluation: ResumeEvaluationResultDetailRecord,
  submittedResults: ResumeCriterionResult[],
  client: Parameters<typeof evaluationTemplateRepository.findVersionById>[1]
): Promise<ResumeCriterionResult[]> {
  const templateVersion = await evaluationTemplateRepository.findVersionById(
    evaluation.templateVersionId,
    client
  );

  if (!templateVersion) {
    throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评价标准版本不存在。");
  }

  const templateCriteria = parseTemplateCriteria(templateVersion.criteria);

  return normalizeCriterionResultsByTemplate(
    submittedResults,
    templateCriteria,
    "VALIDATION_ERROR",
    "criterionResults 必须与当前评价标准版本完全一致。"
  );
}

async function assertEvaluationReviewable(
  evaluation: ResumeEvaluationResultDetailRecord,
  client: Parameters<typeof evaluationTemplateRepository.findVersionById>[1]
): Promise<void> {
  const templateVersion = await evaluationTemplateRepository.findVersionById(
    evaluation.templateVersionId,
    client
  );

  if (!templateVersion) {
    throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评价标准版本不存在。");
  }

  const templateCriteria = parseTemplateCriteria(templateVersion.criteria);
  const normalizedResults = normalizeCriterionResultsByTemplate(
    toDomainCriterionResults(evaluation.criterionResults),
    templateCriteria,
    "CONFLICT",
    "评价内容与当前评价标准版本不一致，请重新保存后审核。"
  );

  if (normalizedResults.some((result) => result.assessment === "NOT_ASSESSED")) {
    throw new ResumeEvaluationResultServiceError(
      "CONFLICT",
      "仍有评价维度未完成，请补充后再审核。"
    );
  }

  if (!evaluation.overallNote?.trim()) {
    throw new ResumeEvaluationResultServiceError(
      "CONFLICT",
      "评估 summary 不能为空，请补充后再审核。"
    );
  }
}

function parseTemplateCriteria(value: Prisma.JsonValue): EvaluationCriterion[] {
  try {
    return parseEvaluationCriteriaJson(value);
  } catch (error) {
    if (error instanceof EvaluationTemplateValidationError) {
      throw new ResumeEvaluationResultServiceError(
        "DATABASE_ERROR",
        "评价标准版本数据无效，请联系管理员。"
      );
    }

    throw error;
  }
}

function normalizeCriterionResultsByTemplate(
  submittedResults: ResumeCriterionResult[],
  templateCriteria: EvaluationCriterion[],
  errorCode: "VALIDATION_ERROR" | "CONFLICT",
  message: string
): ResumeCriterionResult[] {
  const resultByKey = new Map<string, ResumeCriterionResult>();

  submittedResults.forEach((result) => {
    if (resultByKey.has(result.criterionKey)) {
      throw new ResumeEvaluationResultServiceError(errorCode, message);
    }

    resultByKey.set(result.criterionKey, result);
  });

  if (resultByKey.size !== templateCriteria.length) {
    throw new ResumeEvaluationResultServiceError(errorCode, message);
  }

  const normalized = templateCriteria.map((criterion) => {
    const result = resultByKey.get(criterion.key);

    if (!result) {
      throw new ResumeEvaluationResultServiceError(errorCode, message);
    }

    return result;
  });
  const templateKeys = new Set(templateCriteria.map((criterion) => criterion.key));
  const hasExtraKey = submittedResults.some((result) => !templateKeys.has(result.criterionKey));

  if (hasExtraKey) {
    throw new ResumeEvaluationResultServiceError(errorCode, message);
  }

  return normalized;
}

async function classifyReopenFailure(
  id: string,
  expectedRevision: number,
  client: Parameters<typeof resumeEvaluationRepository.findDetailById>[1]
): Promise<never> {
  const refreshed = await resumeEvaluationRepository.findDetailById(id, client);

  if (!refreshed) {
    throw new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。");
  }

  if (refreshed.status !== "REVIEWED") {
    throw new ResumeEvaluationResultServiceError(
      "CONFLICT",
      "只有 REVIEWED 状态的评估可以重新开放。"
    );
  }

  if (refreshed.revision !== expectedRevision) {
    throw new ResumeEvaluationResultServiceError(
      "CONFLICT",
      "评估已被其他操作修改，请刷新后重试。"
    );
  }

  throw new ResumeEvaluationResultServiceError("CONFLICT", "评估状态已变化，请刷新后重试。");
}

function toDetailDto(
  evaluation: ResumeEvaluationResultDetailRecord
): ResumeEvaluationDetailDto {
  return {
    ...toSummaryDto(evaluation),
    criterionResults: toCriterionResultDtos(evaluation.criterionResults),
    events: evaluation.events.map(toEventDto)
  };
}

function toEventDto(
  event: ResumeEvaluationResultDetailRecord["events"][number]
): ResumeEvaluationEventDto {
  return {
    actor: event.actor,
    changedFields: event.changedFields,
    createdAt: event.createdAt.toISOString(),
    evaluationId: event.evaluationId,
    eventType: event.eventType,
    id: event.id,
    note: event.note
  };
}

function toCriterionResultDtos(
  value: Prisma.JsonValue
): ResumeEvaluationCriterionResultDto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as ResumeCriterionResult[]).map((item) => ({
    assessment: item.assessment,
    criterionKey: item.criterionKey,
    evidenceNotes: item.evidenceNotes ?? [],
    recruiterNote: item.recruiterNote ?? null
  }));
}

function toDomainCriterionResults(value: Prisma.JsonValue): ResumeCriterionResult[] {
  return toCriterionResultDtos(value).map((item) => ({
    assessment: item.assessment,
    criterionKey: item.criterionKey,
    evidenceNotes: item.evidenceNotes,
    ...(item.recruiterNote === null ? {} : { recruiterNote: item.recruiterNote })
  }));
}

function computeChangedFields(
  existing: ResumeEvaluationResultDetailRecord,
  input: ResumeEvaluationUpdateInput
): string[] {
  const fields: string[] = [];

  if (
    input.criterionResults !== undefined &&
    !jsonEqual(
      toCriterionResultDtos(existing.criterionResults),
      input.criterionResults
    )
  ) {
    fields.push("criterionResults");
  }

  if (input.overallNote !== undefined && existing.overallNote !== input.overallNote) {
    fields.push("overallNote");
  }

  if (input.evaluatedBy !== undefined && existing.evaluatedBy !== input.evaluatedBy) {
    fields.push("evaluatedBy");
  }

  return fields;
}

function jsonEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function normalizeError(
  error: unknown,
  fallbackMessage: string
): ResumeEvaluationResultServiceError {
  if (error instanceof ResumeEvaluationResultServiceError) {
    return error;
  }

  if (isKnownUniqueConstraint(error)) {
    if (isResumeEvaluationContextUniqueViolation(error)) {
      return new ResumeEvaluationResultServiceError(
        "CONFLICT",
        "该简历在当前岗位、评价标准版本和岗位版本下已存在评价结果。"
      );
    }

    return new ResumeEvaluationResultServiceError("CONFLICT", "数据已存在，请刷新后重试。");
  }

  return new ResumeEvaluationResultServiceError("DATABASE_ERROR", fallbackMessage);
}

export function isResumeEvaluationContextUniqueViolation(error: unknown): boolean {
  if (!isKnownUniqueConstraint(error)) {
    return false;
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    const fields = target.filter((item): item is string => typeof item === "string");

    return (
      fields.length === resumeEvaluationContextFields.length &&
      resumeEvaluationContextFields.every((field) => fields.includes(field))
    );
  }

  if (typeof target === "string") {
    return (
      target === "ResumeEvaluationResult_context_key" ||
      target === "resumeEvaluationContext"
    );
  }

  return false;
}

function isKnownUniqueConstraint(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

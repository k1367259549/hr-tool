import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
import { jobProfileEvaluationAssignmentRepository } from "@/repositories/jobProfileEvaluationAssignment.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type {
  EvaluationCriterion,
  EvaluationTemplateAssignmentInput,
  EvaluationTemplateCreateInput,
  EvaluationTemplateDetailDto,
  EvaluationTemplateDetailRecord,
  EvaluationTemplateListQuery,
  EvaluationTemplateListRecord,
  EvaluationTemplateListResultDto,
  EvaluationTemplateSummaryDto,
  EvaluationTemplateUpdateInput,
  EvaluationTemplateVersionRecord,
  EvaluationTemplateVersionSummaryDto,
  EvaluationTemplateVersionUpdateInput,
  JobProfileEvaluationAssignmentDto,
  JobProfileEvaluationAssignmentRecord,
  JobProfileEvaluationAssignmentResultDto
} from "@/types/evaluationTemplate";

export class EvaluationTemplateServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "EvaluationTemplateServiceError";
    this.code = code;
  }
}

export const evaluationTemplateService = {
  async createTemplate(input: EvaluationTemplateCreateInput): Promise<EvaluationTemplateDetailDto> {
    try {
      const template = await prisma.$transaction((tx) =>
        evaluationTemplateRepository.createTemplateWithInitialDraft(input, tx)
      );

      return toTemplateDetailDto(template, 0);
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "创建评价标准失败。");
    }
  },

  async listTemplates(query: EvaluationTemplateListQuery): Promise<EvaluationTemplateListResultDto> {
    try {
      const result = await evaluationTemplateRepository.listTemplates(query);
      const items = await Promise.all(result.templates.map(toTemplateSummaryWithCountDto));

      return {
        items,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / query.pageSize))
        }
      };
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "查询评价标准失败。");
    }
  },

  async getTemplate(id: string): Promise<EvaluationTemplateDetailDto> {
    try {
      const template = await evaluationTemplateRepository.findTemplateDetailById(id);

      if (!template) {
        throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。");
      }

      const activeAssignmentCount =
        await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id);

      return toTemplateDetailDto(template, activeAssignmentCount);
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "读取评价标准失败。");
    }
  },

  async updateTemplate(
    id: string,
    input: EvaluationTemplateUpdateInput
  ): Promise<EvaluationTemplateDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await evaluationTemplateRepository.findTemplateDetailById(id, tx);

        if (!existing) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。");
        }

        if (!hasTemplateMetadataChanges(existing, input)) {
          const activeCount =
            await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id, tx);
          return toTemplateDetailDto(existing, activeCount);
        }

        const updated = await evaluationTemplateRepository.updateTemplateMetadata(id, input, tx);
        const activeCount =
          await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id, tx);

        return toTemplateDetailDto(updated, activeCount);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "更新评价标准失败。");
    }
  },

  async updateDraftVersion(
    id: string,
    input: EvaluationTemplateVersionUpdateInput
  ): Promise<EvaluationTemplateVersionSummaryDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await evaluationTemplateRepository.findVersionById(id, tx);

        if (!existing) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准版本不存在。");
        }

        if (existing.status !== "DRAFT") {
          throw new EvaluationTemplateServiceError("CONFLICT", "已发布版本不可修改。");
        }

        if (existing.template.status === "ARCHIVED") {
          throw new EvaluationTemplateServiceError("CONFLICT", "已归档评价标准不能编辑 Draft。");
        }

        if (!hasDraftVersionChanges(existing, input)) {
          return toVersionDto(existing);
        }

        const updatedCount = await evaluationTemplateRepository.updateDraftVersion(id, input, tx);

        if (updatedCount === 0) {
          throw new EvaluationTemplateServiceError("CONFLICT", "Draft 状态已变化，请刷新后重试。");
        }

        const updated = await evaluationTemplateRepository.findVersionById(id, tx);

        if (!updated) {
          throw new EvaluationTemplateServiceError("DATABASE_ERROR", "更新版本后读取失败。");
        }

        return toVersionDto(updated);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "更新 Draft 版本失败。");
    }
  },

  async publishVersion(id: string): Promise<EvaluationTemplateVersionSummaryDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await evaluationTemplateRepository.findVersionById(id, tx);

        if (!existing) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准版本不存在。");
        }

        if (existing.status !== "DRAFT") {
          throw new EvaluationTemplateServiceError("CONFLICT", "只有 Draft 版本可以发布。");
        }

        if (existing.template.status !== "ACTIVE") {
          throw new EvaluationTemplateServiceError("CONFLICT", "已归档评价标准不能发布版本。");
        }

        const updatedCount = await evaluationTemplateRepository.publishDraftVersion(id, new Date(), tx);

        if (updatedCount === 0) {
          throw new EvaluationTemplateServiceError("CONFLICT", "版本状态已变化，请刷新后重试。");
        }

        const updated = await evaluationTemplateRepository.findVersionById(id, tx);

        if (!updated) {
          throw new EvaluationTemplateServiceError("DATABASE_ERROR", "发布版本后读取失败。");
        }

        return toVersionDto(updated);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "发布评价标准版本失败。");
    }
  },

  async createNextDraft(templateId: string): Promise<EvaluationTemplateVersionSummaryDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const template = await evaluationTemplateRepository.findTemplateDetailById(templateId, tx);

        if (!template) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。");
        }

        if (template.status !== "ACTIVE") {
          throw new EvaluationTemplateServiceError("CONFLICT", "已归档评价标准不能创建新 Draft。");
        }

        const existingDraft = await evaluationTemplateRepository.findActiveDraft(templateId, tx);

        if (existingDraft) {
          throw new EvaluationTemplateServiceError("CONFLICT", "当前评价标准已有 Draft 版本。");
        }

        const nextVersion = await evaluationTemplateRepository.incrementLatestVersionNumber(
          templateId,
          tx
        );
        const latestPublished = await evaluationTemplateRepository.findLatestPublishedVersion(
          templateId,
          tx
        );
        const created = await evaluationTemplateRepository.createNextDraftVersion(
          templateId,
          nextVersion.latestVersionNumber,
          {
            criteria: latestPublished ? toCriteria(latestPublished.criteria) : [],
            instructions: latestPublished?.instructions ?? null
          },
          tx
        );

        return toVersionDto(created);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "创建下一 Draft 失败。");
    }
  },

  async archiveTemplate(id: string): Promise<EvaluationTemplateDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await evaluationTemplateRepository.findTemplateDetailById(id, tx);

        if (!existing) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。");
        }

        if (existing.status === "ARCHIVED") {
          const activeCount =
            await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id, tx);
          return toTemplateDetailDto(existing, activeCount);
        }

        const activeAssignmentCount =
          await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id, tx);

        if (activeAssignmentCount > 0) {
          throw new EvaluationTemplateServiceError(
            "CONFLICT",
            "仍有岗位正在使用该评价标准，不能归档。"
          );
        }

        const archived = await evaluationTemplateRepository.archiveTemplate(id, new Date(), tx);

        return toTemplateDetailDto(archived, 0);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "归档评价标准失败。");
    }
  },

  async restoreTemplate(id: string): Promise<EvaluationTemplateDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await evaluationTemplateRepository.findTemplateDetailById(id, tx);

        if (!existing) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。");
        }

        if (existing.status === "ACTIVE") {
          const activeCount =
            await jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate(id, tx);
          return toTemplateDetailDto(existing, activeCount);
        }

        const restored = await evaluationTemplateRepository.restoreTemplate(id, tx);

        return toTemplateDetailDto(restored, 0);
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "恢复评价标准失败。");
    }
  },

  async getJobProfileAssignment(
    jobProfileId: string
  ): Promise<JobProfileEvaluationAssignmentResultDto> {
    try {
      const [activeAssignment, history] = await Promise.all([
        jobProfileEvaluationAssignmentRepository.findActiveAssignment(jobProfileId),
        jobProfileEvaluationAssignmentRepository.listAssignmentHistory(jobProfileId)
      ]);

      return {
        activeAssignment: activeAssignment ? toAssignmentDto(activeAssignment) : null,
        history: history.map(toAssignmentDto)
      };
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "读取岗位评价标准分配失败。");
    }
  },

  async assignTemplateVersion(
    jobProfileId: string,
    input: EvaluationTemplateAssignmentInput
  ): Promise<JobProfileEvaluationAssignmentResultDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const jobProfile = await jobProfileRepository.findById(jobProfileId, tx);

        if (!jobProfile) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "岗位画像不存在。");
        }

        if (!jobProfile.reviewedAt) {
          throw new EvaluationTemplateServiceError("CONFLICT", "只能为已人工确认的岗位画像分配评价标准。");
        }

        const version = await evaluationTemplateRepository.findVersionById(input.templateVersionId, tx);

        if (!version) {
          throw new EvaluationTemplateServiceError("NOT_FOUND", "评价标准版本不存在。");
        }

        if (version.status !== "PUBLISHED") {
          throw new EvaluationTemplateServiceError("CONFLICT", "只能分配已发布的评价标准版本。");
        }

        if (version.template.status !== "ACTIVE") {
          throw new EvaluationTemplateServiceError("CONFLICT", "不能分配已归档评价标准。");
        }

        const current = await jobProfileEvaluationAssignmentRepository.findActiveAssignment(
          jobProfileId,
          tx
        );

        if (current?.templateVersionId === input.templateVersionId) {
          const history = await jobProfileEvaluationAssignmentRepository.listAssignmentHistory(
            jobProfileId,
            tx
          );

          return {
            activeAssignment: toAssignmentDto(current),
            history: history.map(toAssignmentDto)
          };
        }

        await jobProfileEvaluationAssignmentRepository.replaceActiveAssignment(
          jobProfileId,
          input,
          new Date(),
          tx
        );

        const [activeAssignment, history] = await Promise.all([
          jobProfileEvaluationAssignmentRepository.findActiveAssignment(jobProfileId, tx),
          jobProfileEvaluationAssignmentRepository.listAssignmentHistory(jobProfileId, tx)
        ]);

        return {
          activeAssignment: activeAssignment ? toAssignmentDto(activeAssignment) : null,
          history: history.map(toAssignmentDto)
        };
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "分配评价标准失败。");
    }
  },

  async unassignTemplateVersion(
    jobProfileId: string
  ): Promise<JobProfileEvaluationAssignmentResultDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        await jobProfileEvaluationAssignmentRepository.endActiveAssignment(
          jobProfileId,
          new Date(),
          tx
        );
        const history = await jobProfileEvaluationAssignmentRepository.listAssignmentHistory(
          jobProfileId,
          tx
        );

        return {
          activeAssignment: null,
          history: history.map(toAssignmentDto)
        };
      });
    } catch (error) {
      throw normalizeEvaluationTemplateError(error, "取消评价标准分配失败。");
    }
  }
};

function toTemplateSummaryWithCountDto(
  template: EvaluationTemplateListRecord
): Promise<EvaluationTemplateSummaryDto> {
  return jobProfileEvaluationAssignmentRepository
    .countActiveAssignmentsForTemplate(template.id)
    .then((count) => toTemplateSummaryDto(template, count));
}

function toTemplateDetailDto(
  template: EvaluationTemplateDetailRecord,
  activeAssignmentCount: number
): EvaluationTemplateDetailDto {
  return {
    ...toTemplateSummaryDto(template, activeAssignmentCount),
    versions: template.versions.map((version) => toVersionDto({ ...version, template }))
  };
}

function toTemplateSummaryDto(
  template: EvaluationTemplateDetailRecord | EvaluationTemplateListRecord,
  activeAssignmentCount: number
): EvaluationTemplateSummaryDto {
  const versions = template.versions.map((version) => toVersionDto({ ...version, template }));
  const currentDraftVersion = versions.find((version) => version.status === "DRAFT") ?? null;
  const latestPublishedVersion = versions.find((version) => version.status === "PUBLISHED") ?? null;

  return {
    activeAssignmentCount,
    archivedAt: template.archivedAt?.toISOString() ?? null,
    createdAt: template.createdAt.toISOString(),
    currentDraftVersion,
    description: template.description,
    id: template.id,
    latestPublishedVersion,
    latestVersionNumber: template.latestVersionNumber,
    name: template.name,
    status: template.status,
    updatedAt: template.updatedAt.toISOString()
  };
}

function toVersionDto(
  version:
    | EvaluationTemplateVersionRecord
    | (EvaluationTemplateDetailRecord["versions"][number] & {
        template: EvaluationTemplateDetailRecord;
      })
): EvaluationTemplateVersionSummaryDto {
  return {
    changeNote: version.changeNote,
    createdAt: version.createdAt.toISOString(),
    createdBy: version.createdBy,
    criteria: toCriteria(version.criteria),
    id: version.id,
    instructions: version.instructions,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    status: version.status,
    templateId: version.templateId,
    updatedAt: version.updatedAt.toISOString(),
    versionNumber: version.versionNumber
  };
}

function toAssignmentDto(
  assignment: JobProfileEvaluationAssignmentRecord
): JobProfileEvaluationAssignmentDto {
  return {
    assignedAt: assignment.assignedAt.toISOString(),
    assignedBy: assignment.assignedBy,
    endedAt: assignment.endedAt?.toISOString() ?? null,
    id: assignment.id,
    jobProfileId: assignment.jobProfileId,
    template: {
      id: assignment.templateVersion.template.id,
      name: assignment.templateVersion.template.name,
      status: assignment.templateVersion.template.status
    },
    templateVersion: toVersionDto(assignment.templateVersion),
    templateVersionId: assignment.templateVersionId
  };
}

function toCriteria(value: Prisma.JsonValue): EvaluationCriterion[] {
  return Array.isArray(value) ? (value as unknown as EvaluationCriterion[]) : [];
}

function hasTemplateMetadataChanges(
  existing: EvaluationTemplateDetailRecord,
  input: EvaluationTemplateUpdateInput
): boolean {
  return (["name", "description"] as const).some((field) => {
    if (!(field in input)) {
      return false;
    }

    return existing[field] !== input[field];
  });
}

function hasDraftVersionChanges(
  existing: EvaluationTemplateVersionRecord,
  input: EvaluationTemplateVersionUpdateInput
): boolean {
  if ("criteria" in input && !jsonEqual(toCriteria(existing.criteria), input.criteria ?? [])) {
    return true;
  }

  return (["instructions", "changeNote", "createdBy"] as const).some((field) => {
    if (!(field in input)) {
      return false;
    }

    return existing[field] !== input[field];
  });
}

function jsonEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function normalizeEvaluationTemplateError(
  error: unknown,
  fallbackMessage: string
): EvaluationTemplateServiceError {
  if (error instanceof EvaluationTemplateServiceError) {
    return error;
  }

  if (isKnownUniqueConstraint(error)) {
    const rawTarget = error.meta?.target;
    const target = Array.isArray(rawTarget)
      ? rawTarget.join(",")
      : typeof rawTarget === "string"
        ? rawTarget
        : "";

    if (target.includes("EvaluationTemplateVersion_one_draft_per_template")) {
      return new EvaluationTemplateServiceError("CONFLICT", "当前评价标准已有 Draft 版本。");
    }

    if (target.includes("JobProfileEvaluationAssignment_one_active_per_job_profile")) {
      return new EvaluationTemplateServiceError("CONFLICT", "该岗位已有活跃评价标准分配，请刷新后重试。");
    }

    return new EvaluationTemplateServiceError("CONFLICT", "数据已存在，请刷新后重试。");
  }

  return new EvaluationTemplateServiceError("DATABASE_ERROR", fallbackMessage);
}

function isKnownUniqueConstraint(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

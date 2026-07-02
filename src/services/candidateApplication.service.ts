import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applicationEventRepository } from "@/repositories/applicationEvent.repository";
import { candidateApplicationRepository } from "@/repositories/candidateApplication.repository";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type {
  ApplicationCreateInput,
  ApplicationDetailRecord,
  ApplicationEvent,
  ApplicationEventDto,
  ApplicationListQuery,
  ApplicationListRecord,
  ApplicationListResultDto,
  ApplicationMetricsDto,
  ApplicationStage,
  ApplicationTransitionInput,
  ApplicationUpdateInput,
  CandidateApplicationDetailDto,
  CandidateApplicationListItemDto
} from "@/types/candidateApplication";
import {
  assertApplicationTransitionAllowed,
  isTerminalApplicationStage
} from "@/utils/candidateApplicationValidation";

const recruiterActor = "RECRUITER";

export class CandidateApplicationServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "CandidateApplicationServiceError";
    this.code = code;
  }
}

export const candidateApplicationService = {
  async createApplication(input: ApplicationCreateInput): Promise<CandidateApplicationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const candidate = await candidateRepository.findById(input.candidateId, tx);

        if (!candidate) {
          throw new CandidateApplicationServiceError("NOT_FOUND", "候选人不存在。");
        }

        if (candidate.status === "ARCHIVED") {
          throw new CandidateApplicationServiceError("CONFLICT", "归档候选人不能创建招聘流程。");
        }

        const jobProfile = await jobProfileRepository.findById(input.jobProfileId, tx);

        if (!jobProfile) {
          throw new CandidateApplicationServiceError("NOT_FOUND", "岗位画像不存在。");
        }

        if (!jobProfile.reviewedAt) {
          throw new CandidateApplicationServiceError("CONFLICT", "只能为已人工确认的岗位画像创建招聘流程。");
        }

        const application = await candidateApplicationRepository.create(input, tx);

        await applicationEventRepository.create(
          {
            actor: recruiterActor,
            applicationId: application.id,
            eventType: "CREATED",
            toStage: application.currentStage
          },
          tx
        );

        const detailed = await candidateApplicationRepository.findDetailedById(application.id, tx);

        if (!detailed) {
          throw new CandidateApplicationServiceError("DATABASE_ERROR", "创建招聘流程后读取失败。");
        }

        return toApplicationDetailDto(detailed);
      });
    } catch (error) {
      throw normalizeApplicationServiceError(error, "创建招聘流程失败。");
    }
  },

  async getApplication(id: string): Promise<CandidateApplicationDetailDto> {
    const application = await candidateApplicationRepository.findDetailedById(id);

    if (!application) {
      throw new CandidateApplicationServiceError("NOT_FOUND", "招聘流程不存在。");
    }

    return toApplicationDetailDto(application);
  },

  async listApplications(query: ApplicationListQuery): Promise<ApplicationListResultDto> {
    try {
      const [listResult, metrics] = await Promise.all([
        candidateApplicationRepository.list(query),
        candidateApplicationRepository.countByStage({
          status: query.status
        })
      ]);

      return {
        applications: listResult.applications.map(toApplicationListItemDto),
        metrics,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: listResult.total,
          totalPages: Math.max(1, Math.ceil(listResult.total / query.pageSize))
        }
      };
    } catch (error) {
      throw normalizeApplicationServiceError(error, "查询招聘流程失败。");
    }
  },

  async updateApplicationMetadata(
    id: string,
    input: ApplicationUpdateInput
  ): Promise<CandidateApplicationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingApplication = await candidateApplicationRepository.findDetailedById(id, tx);

        if (!existingApplication) {
          throw new CandidateApplicationServiceError("NOT_FOUND", "招聘流程不存在。");
        }

        const changedFields = createChangedMetadata(existingApplication, input);

        if (changedFields.length === 0) {
          return toApplicationDetailDto(existingApplication);
        }

        const updatedApplication = await candidateApplicationRepository.updateMetadata(id, input, tx);

        if (changedFields.includes("notes")) {
          await applicationEventRepository.create(
            {
              actor: recruiterActor,
              applicationId: id,
              eventType: "NOTE_ADDED",
              note: input.notes ?? null,
              toStage: updatedApplication.currentStage
            },
            tx
          );
        }

        const detailed = await candidateApplicationRepository.findDetailedById(id, tx);

        if (!detailed) {
          throw new CandidateApplicationServiceError("DATABASE_ERROR", "更新招聘流程后读取失败。");
        }

        return toApplicationDetailDto(detailed);
      });
    } catch (error) {
      throw normalizeApplicationServiceError(error, "更新招聘流程失败。");
    }
  },

  async transitionApplicationStage(
    id: string,
    input: ApplicationTransitionInput
  ): Promise<CandidateApplicationDetailDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingApplication = await candidateApplicationRepository.findById(id, tx);

        if (!existingApplication) {
          throw new CandidateApplicationServiceError("NOT_FOUND", "招聘流程不存在。");
        }

        if (isTerminalApplicationStage(existingApplication.currentStage)) {
          throw new CandidateApplicationServiceError("CONFLICT", "终态招聘流程不能继续移动阶段。");
        }

        try {
          assertApplicationTransitionAllowed(existingApplication.currentStage, input.toStage);
        } catch (error) {
          throw new CandidateApplicationServiceError(
            "CONFLICT",
            error instanceof Error ? error.message : "不允许的阶段移动。"
          );
        }

        const now = new Date();
        const updatedCount = await candidateApplicationRepository.transitionStage(
          id,
          existingApplication.currentStage,
          input.toStage,
          now,
          tx
        );

        if (updatedCount === 0) {
          await handleTransitionRace(id, existingApplication.currentStage, tx);
        }

        await applicationEventRepository.create(
          {
            actor: recruiterActor,
            applicationId: id,
            eventType: "STAGE_CHANGED",
            fromStage: existingApplication.currentStage,
            note: input.note,
            toStage: input.toStage
          },
          tx
        );

        const detailed = await candidateApplicationRepository.findDetailedById(id, tx);

        if (!detailed) {
          throw new CandidateApplicationServiceError("DATABASE_ERROR", "阶段移动后读取失败。");
        }

        return toApplicationDetailDto(detailed);
      });
    } catch (error) {
      throw normalizeApplicationServiceError(error, "移动招聘阶段失败。");
    }
  },

  async getPipelineMetrics(): Promise<ApplicationMetricsDto> {
    return candidateApplicationRepository.countByStage({
      status: "all"
    });
  }
};

async function handleTransitionRace(
  id: string,
  expectedStage: ApplicationStage,
  tx: CandidateDbClient
): Promise<never> {
  const refreshedApplication = await candidateApplicationRepository.findById(id, tx);

  if (!refreshedApplication) {
    throw new CandidateApplicationServiceError("NOT_FOUND", "招聘流程不存在。");
  }

  if (refreshedApplication.currentStage !== expectedStage) {
    throw new CandidateApplicationServiceError("CONFLICT", "招聘阶段已被其他操作更新，请刷新后重试。");
  }

  throw new CandidateApplicationServiceError("CONFLICT", "招聘阶段状态已变化，请刷新后重试。");
}

function normalizeApplicationServiceError(
  error: unknown,
  fallbackMessage: string
): CandidateApplicationServiceError {
  if (error instanceof CandidateApplicationServiceError) {
    return error;
  }

  if (isPrismaUniqueConstraintError(error)) {
    return new CandidateApplicationServiceError(
      "CONFLICT",
      "该候选人在此岗位下已有未关闭的招聘流程。"
    );
  }

  return new CandidateApplicationServiceError("DATABASE_ERROR", fallbackMessage);
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function createChangedMetadata(
  existingApplication: ApplicationDetailRecord,
  input: ApplicationUpdateInput
): Array<keyof ApplicationUpdateInput> {
  const changedFields: Array<keyof ApplicationUpdateInput> = [];

  (["owner", "sourceChannel", "notes"] as const).forEach((field) => {
    if (!(field in input)) {
      return;
    }

    if (existingApplication[field] !== input[field]) {
      changedFields.push(field);
    }
  });

  return changedFields;
}

function toApplicationDetailDto(
  application: ApplicationDetailRecord
): CandidateApplicationDetailDto {
  return {
    ...toApplicationListItemDto(application),
    events: application.events.map(toApplicationEventDto),
    notes: application.notes
  };
}

function toApplicationListItemDto(
  application: ApplicationListRecord
): CandidateApplicationListItemDto {
  return {
    candidate: {
      fullName: application.candidate.fullName,
      id: application.candidate.id,
      owner: application.candidate.owner,
      sourceChannel: application.candidate.sourceChannel,
      status: application.candidate.status
    },
    candidateId: application.candidateId,
    closedAt: application.closedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    currentStage: application.currentStage,
    id: application.id,
    jobProfile: {
      hiringGoal: application.jobProfile.hiringGoal,
      id: application.jobProfile.id,
      jobTitle: application.jobProfile.jobTitle,
      reviewedAt: application.jobProfile.reviewedAt?.toISOString() ?? null
    },
    jobProfileId: application.jobProfileId,
    latestActivityAt: application.latestActivityAt.toISOString(),
    owner: application.owner,
    sourceChannel: application.sourceChannel,
    updatedAt: application.updatedAt.toISOString()
  };
}

function toApplicationEventDto(event: ApplicationEvent): ApplicationEventDto {
  return {
    actor: event.actor,
    applicationId: event.applicationId,
    createdAt: event.createdAt.toISOString(),
    eventType: event.eventType,
    fromStage: event.fromStage,
    id: event.id,
    note: event.note,
    toStage: event.toStage
  };
}

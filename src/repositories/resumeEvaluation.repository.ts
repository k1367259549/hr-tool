import type { Prisma, ResumeReviewerDecision } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type {
  ResumeEvaluationCreateInput,
  ResumeEvaluationListQuery,
  ResumeEvaluationRepositoryListResult,
  ResumeEvaluationResultDetailRecord,
  ResumeEvaluationResultRecord,
  ResumeCriterionResult
} from "@/types/resumeEvaluationResult";

const evaluationListSelect = {
  createdAt: true,
  evaluatedBy: true,
  id: true,
  jobProfileId: true,
  jobProfileVersion: true,
  overallNote: true,
  parsedSnapshotId: true,
  resumeId: true,
  resumeRevisionId: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewedRunId: true,
  reviewerDecision: true,
  reviewerNotes: true,
  revision: true,
  selectedRunId: true,
  status: true,
  templateVersionId: true,
  updatedAt: true
} satisfies Prisma.ResumeEvaluationResultSelect;

const evaluationDetailInclude = {
  events: {
    orderBy: [
      { createdAt: "desc" as const },
      { id: "asc" as const }
    ]
  }
} satisfies Prisma.ResumeEvaluationResultInclude;

const selectedRunUpdateSelect = {
  id: true,
  jobProfileId: true,
  jobProfileVersion: true,
  resumeId: true,
  selectedRunId: true,
  templateVersionId: true
} satisfies Prisma.ResumeEvaluationResultSelect;

const reviewSelect = {
  id: true,
  jobProfileId: true,
  jobProfileVersion: true,
  resumeId: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewedRunId: true,
  reviewerDecision: true,
  reviewerNotes: true,
  selectedRunId: true,
  templateVersionId: true
} satisfies Prisma.ResumeEvaluationResultSelect;

export type ResumeEvaluationSelectedRunUpdateRecord =
  Prisma.ResumeEvaluationResultGetPayload<{
    select: typeof selectedRunUpdateSelect;
  }>;

export type ResumeEvaluationReviewRecord =
  Prisma.ResumeEvaluationResultGetPayload<{
    select: typeof reviewSelect;
  }>;

export const resumeEvaluationRepository = {
  async createWithEvent(
    input: ResumeEvaluationCreateInput,
    jobProfileVersion: string,
    criterionResults: ResumeCriterionResult[],
    actor: string | null,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationResultDetailRecord> {
    return client.resumeEvaluationResult.create({
      data: {
        criterionResults: criterionResults as unknown as Prisma.InputJsonValue,
        evaluatedBy: input.evaluatedBy,
        events: {
          create: {
            actor,
            changedFields: [],
            eventType: "CREATED"
          }
        },
        jobProfileId: input.jobProfileId,
        jobProfileVersion,
        parsedSnapshotId: input.parsedSnapshotId,
        resumeId: input.resumeId,
        resumeRevisionId: input.resumeRevisionId,
        templateVersionId: input.templateVersionId
      },
      include: evaluationDetailInclude
    });
  },

  async list(
    query: ResumeEvaluationListQuery,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRepositoryListResult> {
    const where = createListWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [evaluations, total] = await (client as typeof prisma).$transaction([
      (client as typeof prisma).resumeEvaluationResult.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        select: evaluationListSelect,
        skip,
        take: query.pageSize,
        where
      }),
      (client as typeof prisma).resumeEvaluationResult.count({ where })
    ]);

    return { evaluations: evaluations as ResumeEvaluationResultRecord[], total };
  },

  async count(
    query: ResumeEvaluationListQuery,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    return client.resumeEvaluationResult.count({ where: createListWhere(query) });
  },

  async findDetailById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationResultDetailRecord | null> {
    return client.resumeEvaluationResult.findUnique({
      include: evaluationDetailInclude,
      where: { id }
    });
  },

  async findExistingContext(
    resumeId: string,
    jobProfileId: string,
    templateVersionId: string,
    jobProfileVersion: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationResultDetailRecord | null> {
    return client.resumeEvaluationResult.findUnique({
      include: evaluationDetailInclude,
      where: {
        resumeEvaluationContext: {
          jobProfileId,
          jobProfileVersion,
          resumeId,
          templateVersionId
        }
      }
    });
  },

  async findEvaluationForSelectedRunUpdate(
    evaluationId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationSelectedRunUpdateRecord | null> {
    return client.resumeEvaluationResult.findUnique({
      select: selectedRunUpdateSelect,
      where: { id: evaluationId }
    });
  },

  async findEvaluationForReview(
    evaluationId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationReviewRecord | null> {
    return client.resumeEvaluationResult.findUnique({
      select: reviewSelect,
      where: { id: evaluationId }
    });
  },

  async updateSelectedRun(
    evaluationId: string,
    selectedRunId: string | null,
    client: CandidateDbClient = prisma
  ): Promise<void> {
    await client.resumeEvaluationResult.update({
      data: {
        selectedRunId
      },
      where: { id: evaluationId }
    });
  },

  async updateReview(
    evaluationId: string,
    input: {
      reviewedRunId: string | null;
      reviewerDecision: ResumeReviewerDecision;
      reviewerNotes: string | null;
      reviewedAt: Date;
      reviewedBy: string | null;
    },
    client: CandidateDbClient = prisma
  ): Promise<void> {
    await client.resumeEvaluationResult.update({
      data: {
        reviewedAt: input.reviewedAt,
        reviewedBy: input.reviewedBy,
        reviewedRunId: input.reviewedRunId,
        reviewerDecision: input.reviewerDecision,
        reviewerNotes: input.reviewerNotes
      },
      where: { id: evaluationId }
    });
  },

  async updateDraftWithEvent(
    id: string,
    revision: number,
    criterionResults: ResumeCriterionResult[] | undefined,
    overallNote: string | null | undefined,
    evaluatedBy: string | null | undefined,
    changedFields: string[],
    actor: string | null,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const data: Prisma.ResumeEvaluationResultUncheckedUpdateManyInput = {
      revision: { increment: 1 }
    };

    if (criterionResults !== undefined) {
      data.criterionResults = criterionResults as unknown as Prisma.InputJsonValue;
    }

    if (overallNote !== undefined) {
      data.overallNote = overallNote;
    }

    if (evaluatedBy !== undefined) {
      data.evaluatedBy = evaluatedBy;
    }

    const result = await client.resumeEvaluationResult.updateMany({
      data,
      where: { id, revision, status: "DRAFT" }
    });

    if (result.count > 0) {
      await client.resumeEvaluationEvent.create({
        data: { actor, changedFields, evaluationId: id, eventType: "UPDATED" }
      });
    }

    return result.count;
  },

  async reviewWithEvent(
    id: string,
    revision: number,
    reviewedAt: Date,
    actor: string | null,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.resumeEvaluationResult.updateMany({
      data: {
        reviewedAt,
        revision: { increment: 1 },
        status: "REVIEWED"
      },
      where: { id, revision, status: "DRAFT" }
    });

    if (result.count > 0) {
      await client.resumeEvaluationEvent.create({
        data: {
          actor,
          changedFields: ["status", "reviewedAt"],
          evaluationId: id,
          eventType: "REVIEWED"
        }
      });
    }

    return result.count;
  },

  async reopenWithEvent(
    id: string,
    expectedRevision: number,
    actor: string | null,
    note: string,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.resumeEvaluationResult.updateMany({
      data: {
        reviewedAt: null,
        revision: { increment: 1 },
        status: "DRAFT"
      },
      where: { id, revision: expectedRevision, status: "REVIEWED" }
    });

    if (result.count > 0) {
      await client.resumeEvaluationEvent.create({
        data: {
          actor,
          changedFields: ["status", "reviewedAt"],
          evaluationId: id,
          eventType: "REOPENED",
          note
        }
      });
    }

    return result.count;
  },

  async listEvents(
    evaluationId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationResultDetailRecord["events"]> {
    return client.resumeEvaluationEvent.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      where: { evaluationId }
    });
  },

  async listEvaluationOptions(
    resumeId: string,
    client: CandidateDbClient = prisma
  ) {
    const [jobProfiles, templateVersions] = await Promise.all([
      client.jobProfile.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        select: { id: true, jobTitle: true, reviewedAt: true },
        where: { reviewedAt: { not: null } }
      }),
      client.evaluationTemplateVersion.findMany({
        orderBy: [{ versionNumber: "desc" }, { id: "asc" }],
        select: {
          id: true,
          status: true,
          template: { select: { id: true, name: true, status: true } },
          versionNumber: true
        },
        where: {
          status: "PUBLISHED",
          template: { status: "ACTIVE" }
        }
      })
    ]);

    return { jobProfiles, templateVersions };
  }
};

function createListWhere(
  query: ResumeEvaluationListQuery
): Prisma.ResumeEvaluationResultWhereInput {
  const where: Prisma.ResumeEvaluationResultWhereInput = {};

  if (query.resumeId) {
    where.resumeId = query.resumeId;
  }

  if (query.jobProfileId) {
    where.jobProfileId = query.jobProfileId;
  }

  if (query.templateVersionId) {
    where.templateVersionId = query.templateVersionId;
  }

  if (query.status) {
    where.status = query.status;
  }

  return where;
}

import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type {
  JobProfileEvaluationAssignmentRecord,
  EvaluationTemplateAssignmentInput
} from "@/types/evaluationTemplate";

const assignmentInclude = {
  templateVersion: {
    include: {
      template: true
    }
  }
};

export const jobProfileEvaluationAssignmentRepository = {
  async findActiveAssignment(
    jobProfileId: string,
    client: CandidateDbClient = prisma
  ): Promise<JobProfileEvaluationAssignmentRecord | null> {
    return client.jobProfileEvaluationAssignment.findFirst({
      include: assignmentInclude,
      where: {
        endedAt: null,
        jobProfileId
      }
    });
  },

  async listAssignmentHistory(
    jobProfileId: string,
    client: CandidateDbClient = prisma
  ): Promise<JobProfileEvaluationAssignmentRecord[]> {
    return client.jobProfileEvaluationAssignment.findMany({
      include: assignmentInclude,
      orderBy: [
        {
          assignedAt: "desc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        jobProfileId
      }
    });
  },

  async replaceActiveAssignment(
    jobProfileId: string,
    input: EvaluationTemplateAssignmentInput,
    endedAt: Date,
    client: CandidateDbClient = prisma
  ): Promise<JobProfileEvaluationAssignmentRecord> {
    await client.jobProfileEvaluationAssignment.updateMany({
      data: {
        endedAt
      },
      where: {
        endedAt: null,
        jobProfileId
      }
    });

    return client.jobProfileEvaluationAssignment.create({
      data: {
        assignedAt: endedAt,
        assignedBy: input.assignedBy,
        jobProfileId,
        templateVersionId: input.templateVersionId
      },
      include: assignmentInclude
    });
  },

  async endActiveAssignment(
    jobProfileId: string,
    endedAt: Date,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.jobProfileEvaluationAssignment.updateMany({
      data: {
        endedAt
      },
      where: {
        endedAt: null,
        jobProfileId
      }
    });

    return result.count;
  },

  async countActiveAssignmentsForTemplate(
    templateId: string,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    return client.jobProfileEvaluationAssignment.count({
      where: {
        endedAt: null,
        templateVersion: {
          templateId
        }
      }
    });
  }
};

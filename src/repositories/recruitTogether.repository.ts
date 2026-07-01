import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  RecruitTogetherCreateInput,
  RecruitTogetherWorkflow
} from "@/types/recruitTogether";

export const recruitTogetherRepository = {
  async findMany(): Promise<RecruitTogetherWorkflow[]> {
    return prisma.recruitTogetherWorkflow.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findManyCreatedBetween(
    startDate: Date,
    endDate: Date
  ): Promise<RecruitTogetherWorkflow[]> {
    return prisma.recruitTogetherWorkflow.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      }
    });
  },

  async create(data: RecruitTogetherCreateInput & { workflowId: string }): Promise<RecruitTogetherWorkflow> {
    const reviewedAt = new Date().toISOString();

    return prisma.recruitTogetherWorkflow.create({
      data: {
        aiModel: data.aiModel,
        aiProvider: data.aiProvider,
        candidateInsightId: data.candidateInsightId,
        generationTimes: data.generationTimes as Prisma.InputJsonValue,
        humanReview: {
          completed: true,
          required: true,
          reviewedAt,
          reviewType: "manual_notes_and_editable_ai_outputs"
        },
        interviewNotes: data.interviewNotes as unknown as Prisma.InputJsonValue,
        interviewPreparation: data.interviewPreparation as unknown as Prisma.InputJsonValue,
        jobProfileId: data.jobProfileId,
        phoneNotes: data.phoneNotes as unknown as Prisma.InputJsonValue,
        phonePreparation: data.phonePreparation as unknown as Prisma.InputJsonValue,
        promptVersions: data.promptVersions as Prisma.InputJsonValue,
        recruiterSummary: data.recruiterSummary as unknown as Prisma.InputJsonValue,
        workflowId: data.workflowId
      }
    });
  }
};

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  DailyRecruitingWorkspace,
  DailyWorkspaceCreateInput
} from "@/types/dailyWorkspace";

export const dailyWorkspaceRepository = {
  async findMany(): Promise<DailyRecruitingWorkspace[]> {
    return prisma.dailyRecruitingWorkspace.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findManyCreatedBetween(
    startDate: Date,
    endDate: Date
  ): Promise<DailyRecruitingWorkspace[]> {
    return prisma.dailyRecruitingWorkspace.findMany({
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

  async create(data: DailyWorkspaceCreateInput): Promise<DailyRecruitingWorkspace> {
    const reviewedAt = new Date().toISOString();

    return prisma.dailyRecruitingWorkspace.create({
      data: {
        activitySnapshot: data.activitySnapshot as unknown as Prisma.InputJsonValue,
        aiModel: data.aiModel,
        aiProvider: data.aiProvider,
        dailySummary: data.dailySummary as unknown as Prisma.InputJsonValue,
        date: new Date(data.date),
        generationTimes: data.generationTimes as Prisma.InputJsonValue,
        humanReview: {
          completed: true,
          learningAssetsCreated: false,
          required: true,
          reviewedAt,
          reviewType: "daily_workspace_manual_review"
        },
        improvementSuggestions: data.improvementSuggestions as unknown as Prisma.InputJsonValue,
        manualNotes: data.manualNotes,
        promptVersions: data.promptVersions as Prisma.InputJsonValue,
        recruitingInsights: data.recruitingInsights as unknown as Prisma.InputJsonValue,
        tomorrowPriorities: data.tomorrowPriorities as unknown as Prisma.InputJsonValue,
        workflowId: data.workflowId
      }
    });
  }
};

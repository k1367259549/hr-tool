import { prisma } from "@/lib/prisma";
import type { JobProfile, JobProfileCreateInput } from "@/types/jobProfile";

export const jobProfileRepository = {
  async findMany(): Promise<JobProfile[]> {
    return prisma.jobProfile.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findManyCreatedBetween(startDate: Date, endDate: Date): Promise<JobProfile[]> {
    return prisma.jobProfile.findMany({
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

  async findById(id: string): Promise<JobProfile | null> {
    return prisma.jobProfile.findUnique({
      where: {
        id
      }
    });
  },

  async create(data: JobProfileCreateInput): Promise<JobProfile> {
    return prisma.jobProfile.create({
      data: {
        aiModel: data.aiModel,
        aiProvider: data.aiProvider,
        coreResponsibilities: data.coreResponsibilities,
        generationTimeMs: data.generationTimeMs,
        hiringFocus: data.hiringFocus,
        hiringGoal: data.hiringGoal,
        interviewFocus: data.interviewFocus,
        jd: data.jd,
        jobSummary: data.jobSummary,
        jobTitle: data.jobTitle,
        leaderRequirements: data.leaderRequirements,
        missingInformation: data.missingInformation,
        notes: data.notes,
        potentialRisks: data.potentialRisks,
        preferredCompetencies: data.preferredCompetencies,
        promptFile: data.promptFile,
        promptVersion: data.promptVersion,
        requiredCompetencies: data.requiredCompetencies,
        reviewedAt: new Date(),
        suggestedFollowUpQuestions: data.suggestedFollowUpQuestions,
        teamBackground: data.teamBackground,
        workflowId: data.workflowId
      }
    });
  }
};

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CandidateInsight,
  CandidateInsightCreateInput
} from "@/types/candidateUnderstanding";

export const candidateInsightRepository = {
  async findMany(jobProfileId?: string): Promise<CandidateInsight[]> {
    return prisma.candidateInsight.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: jobProfileId
        ? {
            jobProfileId
          }
        : undefined
    });
  },

  async findManyCreatedBetween(startDate: Date, endDate: Date): Promise<CandidateInsight[]> {
    return prisma.candidateInsight.findMany({
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

  async findById(id: string): Promise<CandidateInsight | null> {
    return prisma.candidateInsight.findUnique({
      where: {
        id
      }
    });
  },

  async create(data: CandidateInsightCreateInput): Promise<CandidateInsight> {
    return prisma.candidateInsight.create({
      data: {
        aiModel: data.aiModel,
        aiProvider: data.aiProvider,
        candidateSource: data.candidateSource,
        evidence: data.evidence as unknown as Prisma.InputJsonValue,
        generationTimeMs: data.generationTimeMs,
        insights: data.insights as unknown as Prisma.InputJsonValue,
        jobProfileId: data.jobProfileId,
        jobProfileVersion: data.jobProfileVersion,
        missingInformation: data.missingInformation,
        notes: data.notes,
        potentialRisks: data.potentialRisks,
        promptFile: data.promptFile,
        promptVersion: data.promptVersion,
        resumeId: data.resumeId,
        resumeVersion: data.resumeVersion,
        reviewedAt: new Date(),
        strengths: data.strengths,
        suggestedInterviewQuestions: data.suggestedInterviewQuestions,
        suggestedNextActions: data.suggestedNextActions,
        suggestedPhoneScreenQuestions: data.suggestedPhoneScreenQuestions,
        summary: data.summary as unknown as Prisma.InputJsonValue,
        workflowId: data.workflowId
      }
    });
  }
};

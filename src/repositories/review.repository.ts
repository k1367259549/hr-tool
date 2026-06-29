import { prisma } from "@/lib/prisma";
import type { DailyReview, DailyReviewRepositoryUpsertInput } from "@/types/review";

export const reviewRepository = {
  async findByLogId(logId: string): Promise<DailyReview | null> {
    return prisma.dailyReview.findUnique({
      where: {
        logId
      }
    });
  },

  async findByLogDate(date: Date): Promise<DailyReview | null> {
    return prisma.dailyReview.findFirst({
      where: {
        log: {
          date
        }
      }
    });
  },

  async upsertByLogId(data: DailyReviewRepositoryUpsertInput): Promise<DailyReview> {
    return prisma.dailyReview.upsert({
      where: {
        logId: data.logId
      },
      create: data,
      update: {
        summary: data.summary,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        suggestions: data.suggestions,
        score: data.score,
        provider: data.provider,
        model: data.model,
        promptFile: data.promptFile,
        promptVersion: data.promptVersion,
        inputHash: data.inputHash,
        rawOutput: data.rawOutput,
        parsedOutput: data.parsedOutput
      }
    });
  }
};

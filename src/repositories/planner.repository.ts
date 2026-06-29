import { prisma } from "@/lib/prisma";
import type { DailyPlan, DailyPlanRepositoryCreateInput } from "@/types/planner";

export const plannerRepository = {
  async create(data: DailyPlanRepositoryCreateInput): Promise<DailyPlan> {
    return prisma.dailyPlan.create({
      data
    });
  },

  async findLatestByDate(date: Date): Promise<DailyPlan | null> {
    return prisma.dailyPlan.findFirst({
      where: {
        date
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};

import { prisma } from "@/lib/prisma";
import type {
  RecruitLog,
  RecruitLogRepositoryCreateInput,
  RecruitLogRepositoryQueryOptions,
  RecruitLogRepositoryUpdateInput
} from "@/types/log";

export const logRepository = {
  async create(data: RecruitLogRepositoryCreateInput): Promise<RecruitLog> {
    return prisma.recruitLog.create({
      data
    });
  },

  async findMany(options: RecruitLogRepositoryQueryOptions = {}): Promise<RecruitLog[]> {
    return prisma.recruitLog.findMany({
      where: options.date ? { date: options.date } : undefined,
      orderBy: {
        date: "desc"
      },
      take: options.limit
    });
  },

  async findById(id: string): Promise<RecruitLog | null> {
    return prisma.recruitLog.findUnique({
      where: {
        id
      }
    });
  },

  async findByDate(date: Date): Promise<RecruitLog | null> {
    return prisma.recruitLog.findUnique({
      where: {
        date
      }
    });
  },

  async update(id: string, data: RecruitLogRepositoryUpdateInput): Promise<RecruitLog> {
    return prisma.recruitLog.update({
      where: {
        id
      },
      data
    });
  },

  async delete(id: string): Promise<RecruitLog> {
    return prisma.recruitLog.delete({
      where: {
        id
      }
    });
  }
};

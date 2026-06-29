import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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
    const dateFilter: Prisma.DateTimeFilter | Date | undefined =
      options.date ??
      (options.startDate || options.endDate
        ? {
            gte: options.startDate,
            lt: options.endDate
          }
        : undefined);
    const where: Prisma.RecruitLogWhereInput | undefined = dateFilter
      ? {
          date: dateFilter
        }
      : undefined;

    return prisma.recruitLog.findMany({
      where,
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

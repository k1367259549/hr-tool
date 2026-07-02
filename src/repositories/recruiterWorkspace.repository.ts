import { prisma } from "@/lib/prisma";
import type {
  RecruiterWorkspaceNoteInput,
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleItemInput,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";

export const recruiterWorkspaceRepository = {
  async findRecentNotes(limit = 50): Promise<RecruiterWorkspaceNoteRecord[]> {
    return prisma.recruiterWorkspaceNote.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  },

  async findNotesByDate(date: Date): Promise<RecruiterWorkspaceNoteRecord[]> {
    const { endDate, startDate } = getDayRange(date);

    return prisma.recruiterWorkspaceNote.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });
  },

  async createNote(date: Date, data: RecruiterWorkspaceNoteInput): Promise<RecruiterWorkspaceNoteRecord> {
    const content = data.content.trim();
    const category = data.category?.trim() || null;

    return prisma.recruiterWorkspaceNote.create({
      data: {
        category,
        content,
        date,
        searchableText: [category, content].filter(Boolean).join(" "),
        source: "MANUAL"
      }
    });
  },

  async findScheduleByDate(date: Date): Promise<RecruiterWorkspaceScheduleRecord[]> {
    const { endDate, startDate } = getDayRange(date);

    return prisma.recruiterWorkspaceScheduleItem.findMany({
      orderBy: [
        {
          order: "asc"
        },
        {
          createdAt: "asc"
        }
      ],
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });
  },

  async replaceSchedule(
    date: Date,
    items: RecruiterWorkspaceScheduleItemInput[]
  ): Promise<RecruiterWorkspaceScheduleRecord[]> {
    const { endDate, startDate } = getDayRange(date);

    return prisma.$transaction(async (tx) => {
      await tx.recruiterWorkspaceScheduleItem.deleteMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      });

      if (items.length === 0) {
        return [];
      }

      await tx.recruiterWorkspaceScheduleItem.createMany({
        data: items.map((item, index) => ({
          completed: item.completed ?? false,
          date,
          itemType: item.itemType,
          notes: item.notes?.trim() || null,
          order: item.order ?? index,
          relatedName: item.relatedName?.trim() || null,
          startTime: item.startTime?.trim() || null,
          title: item.title.trim()
        }))
      });

      return tx.recruiterWorkspaceScheduleItem.findMany({
        orderBy: [
          {
            order: "asc"
          },
          {
            createdAt: "asc"
          }
        ],
        where: {
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      });
    });
  }
};

function getDayRange(date: Date): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return { endDate, startDate };
}

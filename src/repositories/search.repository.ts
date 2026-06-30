import { prisma } from "@/lib/prisma";
import type { SearchRepositoryResult } from "@/types/search";

const searchResultLimit = 20;

export const searchRepository = {
  async search(query: string): Promise<SearchRepositoryResult> {
    const [logs, knowledgeEntries] = await Promise.all([
      prisma.recruitLog.findMany({
        where: {
          OR: [
            {
              position: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              summary: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              problems: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              reflection: {
                contains: query,
                mode: "insensitive"
              }
            }
          ]
        },
        orderBy: {
          date: "desc"
        },
        take: searchResultLimit
      }),
      prisma.knowledge.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              content: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              tags: {
                has: query
              }
            }
          ]
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: searchResultLimit
      })
    ]);

    return {
      logs,
      knowledgeEntries
    };
  }
};

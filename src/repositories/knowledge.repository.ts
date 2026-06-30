import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  Knowledge,
  KnowledgeRepositoryCreateInput,
  KnowledgeRepositoryQueryOptions,
  KnowledgeRepositoryUpdateInput
} from "@/types/knowledge";

export const knowledgeRepository = {
  async create(data: KnowledgeRepositoryCreateInput): Promise<Knowledge> {
    return prisma.knowledge.create({
      data
    });
  },

  async findMany(options: KnowledgeRepositoryQueryOptions = {}): Promise<Knowledge[]> {
    const where = createKnowledgeWhereInput(options);

    return prisma.knowledge.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findById(id: string): Promise<Knowledge | null> {
    return prisma.knowledge.findUnique({
      where: {
        id
      }
    });
  },

  async update(id: string, data: KnowledgeRepositoryUpdateInput): Promise<Knowledge> {
    return prisma.knowledge.update({
      where: {
        id
      },
      data
    });
  },

  async delete(id: string): Promise<Knowledge> {
    return prisma.knowledge.delete({
      where: {
        id
      }
    });
  }
};

function createKnowledgeWhereInput(
  options: KnowledgeRepositoryQueryOptions
): Prisma.KnowledgeWhereInput | undefined {
  const filters: Prisma.KnowledgeWhereInput[] = [];

  if (options.type !== undefined) {
    filters.push({
      type: options.type
    });
  }

  if (options.tag !== undefined) {
    filters.push({
      tags: {
        has: options.tag
      }
    });
  }

  if (options.keyword !== undefined) {
    filters.push({
      OR: [
        {
          title: {
            contains: options.keyword,
            mode: "insensitive"
          }
        },
        {
          content: {
            contains: options.keyword,
            mode: "insensitive"
          }
        }
      ]
    });
  }

  if (filters.length === 0) {
    return undefined;
  }

  return {
    AND: filters
  };
}

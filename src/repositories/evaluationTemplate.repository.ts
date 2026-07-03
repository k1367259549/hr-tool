import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type {
  EvaluationTemplateCreateInput,
  EvaluationTemplateDetailRecord,
  EvaluationTemplateListQuery,
  EvaluationTemplateRepositoryListResult,
  EvaluationTemplateUpdateInput,
  EvaluationTemplateVersionRecord,
  EvaluationTemplateVersionUpdateInput
} from "@/types/evaluationTemplate";

const templateVersionInclude = {
  template: true
} satisfies Prisma.EvaluationTemplateVersionInclude;

const templateListInclude = {
  _count: {
    select: {
      versions: true
    }
  },
  versions: {
    orderBy: [
      {
        versionNumber: "desc"
      }
    ]
  }
} satisfies Prisma.EvaluationTemplateInclude;

const templateDetailInclude = {
  versions: {
    orderBy: [
      {
        versionNumber: "desc"
      }
    ]
  }
} satisfies Prisma.EvaluationTemplateInclude;

export const evaluationTemplateRepository = {
  async createTemplateWithInitialDraft(
    input: EvaluationTemplateCreateInput,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateDetailRecord> {
    return client.evaluationTemplate.create({
      data: {
        description: input.description,
        latestVersionNumber: 1,
        name: input.name,
        versions: {
          create: {
            criteria: [],
            status: "DRAFT",
            versionNumber: 1
          }
        }
      },
      include: templateDetailInclude
    });
  },

  async listTemplates(query: EvaluationTemplateListQuery): Promise<EvaluationTemplateRepositoryListResult> {
    const where = createTemplateListWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [templates, total] = await prisma.$transaction([
      prisma.evaluationTemplate.findMany({
        include: templateListInclude,
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        skip,
        take: query.pageSize,
        where
      }),
      prisma.evaluationTemplate.count({
        where
      })
    ]);

    return {
      templates,
      total
    };
  },

  async countTemplates(query: EvaluationTemplateListQuery): Promise<number> {
    return prisma.evaluationTemplate.count({
      where: createTemplateListWhere(query)
    });
  },

  async findTemplateDetailById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateDetailRecord | null> {
    return client.evaluationTemplate.findUnique({
      include: templateDetailInclude,
      where: {
        id
      }
    });
  },

  async updateTemplateMetadata(
    id: string,
    input: EvaluationTemplateUpdateInput,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateDetailRecord> {
    return client.evaluationTemplate.update({
      data: {
        description: input.description,
        name: input.name
      },
      include: templateDetailInclude,
      where: {
        id
      }
    });
  },

  async archiveTemplate(
    id: string,
    archivedAt: Date,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateDetailRecord> {
    return client.evaluationTemplate.update({
      data: {
        archivedAt,
        status: "ARCHIVED"
      },
      include: templateDetailInclude,
      where: {
        id
      }
    });
  },

  async restoreTemplate(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateDetailRecord> {
    return client.evaluationTemplate.update({
      data: {
        archivedAt: null,
        status: "ACTIVE"
      },
      include: templateDetailInclude,
      where: {
        id
      }
    });
  },

  async findVersionById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateVersionRecord | null> {
    return client.evaluationTemplateVersion.findUnique({
      include: templateVersionInclude,
      where: {
        id
      }
    });
  },

  async findActiveDraft(
    templateId: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateVersionRecord | null> {
    return client.evaluationTemplateVersion.findFirst({
      include: templateVersionInclude,
      where: {
        status: "DRAFT",
        templateId
      }
    });
  },

  async listTemplateVersions(
    templateId: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateVersionRecord[]> {
    return client.evaluationTemplateVersion.findMany({
      include: templateVersionInclude,
      orderBy: {
        versionNumber: "desc"
      },
      where: {
        templateId
      }
    });
  },

  async updateDraftVersion(
    id: string,
    input: EvaluationTemplateVersionUpdateInput,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.evaluationTemplateVersion.updateMany({
      data: {
        changeNote: input.changeNote,
        createdBy: input.createdBy,
        criteria: input.criteria as unknown as Prisma.InputJsonValue,
        instructions: input.instructions
      },
      where: {
        id,
        status: "DRAFT"
      }
    });

    return result.count;
  },

  async publishDraftVersion(
    id: string,
    publishedAt: Date,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.evaluationTemplateVersion.updateMany({
      data: {
        publishedAt,
        status: "PUBLISHED"
      },
      where: {
        id,
        status: "DRAFT",
        template: {
          status: "ACTIVE"
        }
      }
    });

    return result.count;
  },

  async incrementLatestVersionNumber(
    templateId: string,
    client: CandidateDbClient = prisma
  ): Promise<{ latestVersionNumber: number }> {
    return client.evaluationTemplate.update({
      data: {
        latestVersionNumber: {
          increment: 1
        }
      },
      select: {
        latestVersionNumber: true
      },
      where: {
        id: templateId
      }
    });
  },

  async findLatestPublishedVersion(
    templateId: string,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateVersionRecord | null> {
    return client.evaluationTemplateVersion.findFirst({
      include: templateVersionInclude,
      orderBy: {
        versionNumber: "desc"
      },
      where: {
        status: "PUBLISHED",
        templateId
      }
    });
  },

  async createNextDraftVersion(
    templateId: string,
    versionNumber: number,
    source: Pick<EvaluationTemplateVersionUpdateInput, "criteria" | "instructions">,
    client: CandidateDbClient = prisma
  ): Promise<EvaluationTemplateVersionRecord> {
    return client.evaluationTemplateVersion.create({
      data: {
        criteria: (source.criteria ?? []) as unknown as Prisma.InputJsonValue,
        instructions: source.instructions,
        status: "DRAFT",
        templateId,
        versionNumber
      },
      include: templateVersionInclude
    });
  }
};

function createTemplateListWhere(
  query: EvaluationTemplateListQuery
): Prisma.EvaluationTemplateWhereInput {
  const where: Prisma.EvaluationTemplateWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    const stringFilter = {
      contains: query.search,
      mode: "insensitive"
    } satisfies Prisma.StringFilter<"EvaluationTemplate">;

    where.OR = [
      {
        name: stringFilter
      },
      {
        description: stringFilter
      }
    ];
  }

  return where;
}

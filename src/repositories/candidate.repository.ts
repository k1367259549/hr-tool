import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  Candidate,
  CandidateCreateInput,
  CandidateCountsDto,
  CandidateDetailRecord,
  CandidateListQuery,
  CandidateRepositoryListResult,
  CandidateUpdateInput
} from "@/types/candidate";

export type CandidateDbClient = Prisma.TransactionClient | typeof prisma;

export const candidateRepository = {
  async create(data: CandidateCreateInput, client: CandidateDbClient = prisma): Promise<Candidate> {
    return client.candidate.create({
      data: {
        currentCompany: data.currentCompany,
        currentTitle: data.currentTitle,
        email: data.email,
        fullName: data.fullName,
        notes: data.notes,
        owner: data.owner,
        phone: data.phone,
        sourceChannel: data.sourceChannel,
        status: data.status ?? "ACTIVE",
        tags: data.tags ?? [],
        targetRoles: data.targetRoles ?? []
      }
    });
  },

  async findById(id: string, client: CandidateDbClient = prisma): Promise<CandidateDetailRecord | null> {
    return client.candidate.findUnique({
      include: {
        _count: {
          select: {
            resumes: true
          }
        },
        audits: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      where: {
        id
      }
    });
  },

  async findMany(query: CandidateListQuery): Promise<CandidateRepositoryListResult> {
    const where = createListWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [candidates, total] = await prisma.$transaction([
      prisma.candidate.findMany({
        include: {
          _count: {
            select: {
              resumes: true
            }
          }
        },
        orderBy: [
          {
            latestActivityAt: "desc"
          },
          {
            createdAt: "desc"
          }
        ],
        skip,
        take: query.pageSize,
        where
      }),
      prisma.candidate.count({
        where
      })
    ]);

    return {
      candidates,
      total
    };
  },

  async countByStatus(): Promise<CandidateCountsDto> {
    const [active, talentPool, archived, total] = await prisma.$transaction([
      prisma.candidate.count({
        where: {
          status: "ACTIVE"
        }
      }),
      prisma.candidate.count({
        where: {
          status: "TALENT_POOL"
        }
      }),
      prisma.candidate.count({
        where: {
          status: "ARCHIVED"
        }
      }),
      prisma.candidate.count()
    ]);

    return {
      active,
      archived,
      talentPool,
      total
    };
  },

  async update(id: string, data: CandidateUpdateInput, client: CandidateDbClient = prisma): Promise<Candidate> {
    return client.candidate.update({
      data: {
        currentCompany: data.currentCompany,
        currentTitle: data.currentTitle,
        email: data.email,
        fullName: data.fullName,
        latestActivityAt: new Date(),
        notes: data.notes,
        owner: data.owner,
        phone: data.phone,
        sourceChannel: data.sourceChannel,
        status: data.status,
        tags: data.tags,
        targetRoles: data.targetRoles
      },
      where: {
        id
      }
    });
  },

  async archive(id: string, client: CandidateDbClient = prisma): Promise<Candidate> {
    const now = new Date();

    return client.candidate.update({
      data: {
        archivedAt: now,
        latestActivityAt: now,
        status: "ARCHIVED"
      },
      where: {
        id
      }
    });
  },

  async restore(id: string, client: CandidateDbClient = prisma): Promise<Candidate> {
    const now = new Date();

    return client.candidate.update({
      data: {
        archivedAt: null,
        latestActivityAt: now,
        status: "ACTIVE"
      },
      where: {
        id
      }
    });
  }
};

function createListWhere(query: CandidateListQuery): Prisma.CandidateWhereInput {
  const where: Prisma.CandidateWhereInput = {};

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = {
      not: "ARCHIVED"
    };
  }

  if (query.sourceChannel) {
    where.sourceChannel = {
      contains: query.sourceChannel,
      mode: "insensitive"
    };
  }

  if (query.owner) {
    where.owner = {
      contains: query.owner,
      mode: "insensitive"
    };
  }

  if (query.search) {
    where.OR = createSearchWhere(query.search);
  }

  return where;
}

function createSearchWhere(search: string): Prisma.CandidateWhereInput[] {
  const stringFilter: Prisma.StringFilter<"Candidate"> = {
    contains: search,
    mode: "insensitive"
  };

  return [
    {
      fullName: stringFilter
    },
    {
      email: stringFilter
    },
    {
      phone: stringFilter
    },
    {
      currentCompany: stringFilter
    },
    {
      currentTitle: stringFilter
    },
    {
      sourceChannel: stringFilter
    },
    {
      owner: stringFilter
    },
    {
      tags: {
        has: search
      }
    }
  ];
}

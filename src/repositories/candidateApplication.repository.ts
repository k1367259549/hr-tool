import type { ApplicationStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type {
  ApplicationCreateInput,
  ApplicationListQuery,
  ApplicationRepositoryListResult,
  ApplicationDetailRecord,
  ApplicationListRecord,
  ApplicationUpdateInput
} from "@/types/candidateApplication";

const applicationListInclude = {
  candidate: {
    select: {
      fullName: true,
      id: true,
      owner: true,
      sourceChannel: true,
      status: true
    }
  },
  jobProfile: {
    select: {
      hiringGoal: true,
      id: true,
      jobTitle: true,
      reviewedAt: true
    }
  }
} satisfies Prisma.CandidateApplicationInclude;

const applicationDetailInclude = {
  ...applicationListInclude,
  events: {
    orderBy: {
      createdAt: "desc"
    }
  }
} satisfies Prisma.CandidateApplicationInclude;

export const candidateApplicationRepository = {
  async create(
    input: ApplicationCreateInput,
    client: CandidateDbClient = prisma
  ): Promise<ApplicationDetailRecord> {
    return client.candidateApplication.create({
      data: {
        candidateId: input.candidateId,
        jobProfileId: input.jobProfileId,
        notes: input.notes,
        owner: input.owner,
        sourceChannel: input.sourceChannel
      },
      include: applicationDetailInclude
    });
  },

  async findById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<ApplicationListRecord | null> {
    return client.candidateApplication.findUnique({
      include: applicationListInclude,
      where: {
        id
      }
    });
  },

  async findDetailedById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<ApplicationDetailRecord | null> {
    return client.candidateApplication.findUnique({
      include: applicationDetailInclude,
      where: {
        id
      }
    });
  },

  async list(query: ApplicationListQuery): Promise<ApplicationRepositoryListResult> {
    const where = createListWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [applications, total] = await prisma.$transaction([
      prisma.candidateApplication.findMany({
        include: applicationListInclude,
        orderBy: [
          {
            latestActivityAt: "desc"
          },
          {
            createdAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        skip,
        take: query.pageSize,
        where
      }),
      prisma.candidateApplication.count({
        where
      })
    ]);

    return {
      applications,
      total
    };
  },

  async countByStage(query: Pick<ApplicationListQuery, "status"> = { status: "all" }): Promise<Record<ApplicationStage, number>> {
    const where = createStatusWhere(query.status);
    const grouped = await prisma.candidateApplication.groupBy({
      _count: {
        _all: true
      },
      by: ["currentStage"],
      where
    });
    const counts = createEmptyStageCounts();

    grouped.forEach((item) => {
      counts[item.currentStage] = item._count._all;
    });

    return counts;
  },

  async updateMetadata(
    id: string,
    input: ApplicationUpdateInput,
    client: CandidateDbClient = prisma
  ): Promise<ApplicationDetailRecord> {
    return client.candidateApplication.update({
      data: {
        notes: input.notes,
        owner: input.owner,
        sourceChannel: input.sourceChannel
      },
      include: applicationDetailInclude,
      where: {
        id
      }
    });
  },

  async transitionStage(
    id: string,
    expectedCurrentStage: ApplicationStage,
    toStage: ApplicationStage,
    now: Date,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.candidateApplication.updateMany({
      data: {
        closedAt: isTerminalStage(toStage) ? now : null,
        currentStage: toStage,
        latestActivityAt: now
      },
      where: {
        currentStage: expectedCurrentStage,
        id
      }
    });

    return result.count;
  }
};

function createListWhere(query: ApplicationListQuery): Prisma.CandidateApplicationWhereInput {
  const where: Prisma.CandidateApplicationWhereInput = {
    ...createStatusWhere(query.status)
  };

  if (query.stage) {
    where.currentStage = query.stage;
  }

  if (query.jobProfileId) {
    where.jobProfileId = query.jobProfileId;
  }

  if (query.candidateId) {
    where.candidateId = query.candidateId;
  }

  if (query.owner) {
    where.owner = {
      contains: query.owner,
      mode: "insensitive"
    };
  }

  if (query.search) {
    const stringFilter = {
      contains: query.search,
      mode: "insensitive"
    } satisfies Prisma.StringFilter<"CandidateApplication">;

    where.OR = [
      {
        owner: stringFilter
      },
      {
        candidate: {
          fullName: {
            contains: query.search,
            mode: "insensitive"
          }
        }
      },
      {
        jobProfile: {
          jobTitle: {
            contains: query.search,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  return where;
}

function createStatusWhere(status: ApplicationListQuery["status"]): Prisma.CandidateApplicationWhereInput {
  if (status === "open") {
    return {
      closedAt: null
    };
  }

  if (status === "closed") {
    return {
      closedAt: {
        not: null
      }
    };
  }

  return {};
}

function createEmptyStageCounts(): Record<ApplicationStage, number> {
  return {
    HIRED: 0,
    INTERVIEW: 0,
    NEW: 0,
    OFFER: 0,
    PHONE_SCREEN: 0,
    REJECTED: 0,
    RESUME_SCREEN: 0,
    WITHDRAWN: 0
  };
}

function isTerminalStage(stage: ApplicationStage): boolean {
  return stage === "HIRED" || stage === "REJECTED" || stage === "WITHDRAWN";
}

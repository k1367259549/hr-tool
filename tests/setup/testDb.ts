import type { KnowledgeSource, KnowledgeType, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { vi, type Mock } from "vitest";
import type {
  RecruitLog,
  RecruitLogRepositoryCreateInput,
  RecruitLogRepositoryQueryOptions,
  RecruitLogRepositoryUpdateInput
} from "@/types/log";
import type {
  Knowledge,
  KnowledgeRepositoryCreateInput,
  KnowledgeRepositoryQueryOptions,
  KnowledgeRepositoryUpdateInput
} from "@/types/knowledge";

export type ApiJson<TData> = {
  success: boolean;
  data: TData | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type MockedRepository<TRepository> = {
  [TKey in keyof TRepository]: TRepository[TKey] extends (...args: infer TArgs) => infer TReturn
    ? Mock<TArgs, TReturn>
    : TRepository[TKey];
};

type LogRepositoryShape = {
  create(data: RecruitLogRepositoryCreateInput): Promise<RecruitLog>;
  findMany(options?: RecruitLogRepositoryQueryOptions): Promise<RecruitLog[]>;
  findById(id: string): Promise<RecruitLog | null>;
  findByDate(date: Date): Promise<RecruitLog | null>;
  update(id: string, data: RecruitLogRepositoryUpdateInput): Promise<RecruitLog>;
  delete(id: string): Promise<RecruitLog>;
};

type KnowledgeRepositoryShape = {
  create(data: KnowledgeRepositoryCreateInput): Promise<Knowledge>;
  findMany(options?: KnowledgeRepositoryQueryOptions): Promise<Knowledge[]>;
  findById(id: string): Promise<Knowledge | null>;
  findByTitle(title: string): Promise<Knowledge | null>;
  update(id: string, data: KnowledgeRepositoryUpdateInput): Promise<Knowledge>;
  delete(id: string): Promise<Knowledge>;
};

export type MockLogRepository = MockedRepository<LogRepositoryShape>;
export type MockKnowledgeRepository = MockedRepository<KnowledgeRepositoryShape>;

let idSequence = 1;

export function resetTestDb(): void {
  idSequence = 1;
}

export function createJsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
}

export function createGetRequest(url: string): NextRequest {
  return new NextRequest(url, {
    method: "GET"
  });
}

export async function readApiJson<TData>(response: Response): Promise<ApiJson<TData>> {
  return (await response.json()) as ApiJson<TData>;
}

export function createMemoryLogRepository(initialLogs: RecruitLog[] = []): MockLogRepository {
  const logs = [...initialLogs];

  return {
    create: vi.fn(async (data: RecruitLogRepositoryCreateInput): Promise<RecruitLog> => {
      const now = new Date("2026-01-01T00:00:00.000Z");
      const log: RecruitLog = {
        channel: data.channel ?? null,
        createdAt: now,
        date: data.date,
        entryCount: data.entryCount ?? 0,
        id: createTestUuid(),
        interviewCount: data.interviewCount ?? 0,
        offerCount: data.offerCount ?? 0,
        phoneCount: data.phoneCount ?? 0,
        position: data.position ?? null,
        priority: data.priority ?? null,
        problems: data.problems ?? null,
        reflection: data.reflection ?? null,
        resumeCount: data.resumeCount ?? 0,
        roleType: data.roleType ?? null,
        screenCount: data.screenCount ?? 0,
        source: data.source ?? null,
        summary: data.summary ?? null,
        updatedAt: now
      };

      logs.push(log);

      return log;
    }),
    delete: vi.fn(async (id: string): Promise<RecruitLog> => {
      const index = logs.findIndex((log) => log.id === id);

      if (index === -1) {
        throw new Error("Log not found.");
      }

      const [deletedLog] = logs.splice(index, 1);

      if (!deletedLog) {
        throw new Error("Log not found.");
      }

      return deletedLog;
    }),
    findByDate: vi.fn(async (date: Date): Promise<RecruitLog | null> => {
      const targetTime = date.getTime();

      return logs.find((log) => log.date.getTime() === targetTime) ?? null;
    }),
    findById: vi.fn(async (id: string): Promise<RecruitLog | null> => {
      return logs.find((log) => log.id === id) ?? null;
    }),
    findMany: vi.fn(async (options: RecruitLogRepositoryQueryOptions = {}): Promise<RecruitLog[]> => {
      let results = [...logs];

      if (options.date !== undefined) {
        const targetTime = options.date.getTime();
        results = results.filter((log) => log.date.getTime() === targetTime);
      }

      if (options.startDate !== undefined || options.endDate !== undefined) {
        results = results.filter((log) => {
          const time = log.date.getTime();
          const afterStart = options.startDate === undefined || time >= options.startDate.getTime();
          const beforeEnd = options.endDate === undefined || time < options.endDate.getTime();

          return afterStart && beforeEnd;
        });
      }

      results.sort((first, second) => second.date.getTime() - first.date.getTime());

      return options.limit === undefined ? results : results.slice(0, options.limit);
    }),
    update: vi.fn(
      async (id: string, data: RecruitLogRepositoryUpdateInput): Promise<RecruitLog> => {
        const index = logs.findIndex((log) => log.id === id);

        if (index === -1) {
          throw new Error("Log not found.");
        }

        const existingLog = logs[index];

        if (!existingLog) {
          throw new Error("Log not found.");
        }

        const updatedLog: RecruitLog = {
          ...existingLog,
          channel: data.channel === undefined ? existingLog.channel : data.channel,
          date: data.date === undefined ? existingLog.date : data.date,
          entryCount: data.entryCount === undefined ? existingLog.entryCount : data.entryCount,
          interviewCount:
            data.interviewCount === undefined ? existingLog.interviewCount : data.interviewCount,
          offerCount: data.offerCount === undefined ? existingLog.offerCount : data.offerCount,
          phoneCount: data.phoneCount === undefined ? existingLog.phoneCount : data.phoneCount,
          position: data.position === undefined ? existingLog.position : data.position,
          priority: data.priority === undefined ? existingLog.priority : data.priority,
          problems: data.problems === undefined ? existingLog.problems : data.problems,
          reflection: data.reflection === undefined ? existingLog.reflection : data.reflection,
          resumeCount: data.resumeCount === undefined ? existingLog.resumeCount : data.resumeCount,
          roleType: data.roleType === undefined ? existingLog.roleType : data.roleType,
          screenCount: data.screenCount === undefined ? existingLog.screenCount : data.screenCount,
          source: data.source === undefined ? existingLog.source : data.source,
          summary: data.summary === undefined ? existingLog.summary : data.summary,
          updatedAt: new Date("2026-01-02T00:00:00.000Z")
        };

        logs[index] = updatedLog;

        return updatedLog;
      }
    )
  };
}

export function createMemoryKnowledgeRepository(
  initialKnowledge: Knowledge[] = []
): MockKnowledgeRepository {
  const knowledgeEntries = [...initialKnowledge];

  return {
    create: vi.fn(async (data: KnowledgeRepositoryCreateInput): Promise<Knowledge> => {
      const now = new Date("2026-01-01T00:00:00.000Z");
      const knowledge: Knowledge = {
        content: data.content,
        createdAt: now,
        id: createTestUuid(),
        parsedOutput: (data.parsedOutput ?? null) as Prisma.JsonValue | null,
        rawOutput: (data.rawOutput ?? null) as Prisma.JsonValue | null,
        source: data.source,
        sourcePlanId: data.sourcePlanId ?? null,
        sourceReviewId: data.sourceReviewId ?? null,
        tags: data.tags,
        title: data.title,
        type: data.type,
        updatedAt: now
      };

      knowledgeEntries.push(knowledge);

      return knowledge;
    }),
    delete: vi.fn(async (id: string): Promise<Knowledge> => {
      const index = knowledgeEntries.findIndex((knowledge) => knowledge.id === id);

      if (index === -1) {
        throw new Error("Knowledge entry not found.");
      }

      const [deletedKnowledge] = knowledgeEntries.splice(index, 1);

      if (!deletedKnowledge) {
        throw new Error("Knowledge entry not found.");
      }

      return deletedKnowledge;
    }),
    findById: vi.fn(async (id: string): Promise<Knowledge | null> => {
      return knowledgeEntries.find((knowledge) => knowledge.id === id) ?? null;
    }),
    findByTitle: vi.fn(async (title: string): Promise<Knowledge | null> => {
      return knowledgeEntries.find((knowledge) => knowledge.title === title) ?? null;
    }),
    findMany: vi.fn(
      async (options: KnowledgeRepositoryQueryOptions = {}): Promise<Knowledge[]> => {
        return knowledgeEntries.filter((knowledge) => matchesKnowledgeQuery(knowledge, options));
      }
    ),
    update: vi.fn(
      async (id: string, data: KnowledgeRepositoryUpdateInput): Promise<Knowledge> => {
        const index = knowledgeEntries.findIndex((knowledge) => knowledge.id === id);

        if (index === -1) {
          throw new Error("Knowledge entry not found.");
        }

        const existingKnowledge = knowledgeEntries[index];

        if (!existingKnowledge) {
          throw new Error("Knowledge entry not found.");
        }

        const updatedKnowledge: Knowledge = {
          ...existingKnowledge,
          content: data.content ?? existingKnowledge.content,
          parsedOutput:
            data.parsedOutput === undefined
              ? existingKnowledge.parsedOutput
              : (data.parsedOutput as Prisma.JsonValue | null),
          rawOutput:
            data.rawOutput === undefined
              ? existingKnowledge.rawOutput
              : (data.rawOutput as Prisma.JsonValue | null),
          source: data.source ?? existingKnowledge.source,
          sourcePlanId:
            data.sourcePlanId === undefined ? existingKnowledge.sourcePlanId : data.sourcePlanId,
          sourceReviewId:
            data.sourceReviewId === undefined
              ? existingKnowledge.sourceReviewId
              : data.sourceReviewId,
          tags: data.tags ?? existingKnowledge.tags,
          title: data.title ?? existingKnowledge.title,
          type: data.type ?? existingKnowledge.type,
          updatedAt: new Date("2026-01-02T00:00:00.000Z")
        };

        knowledgeEntries[index] = updatedKnowledge;

        return updatedKnowledge;
      }
    )
  };
}

export function createRecruitLog(overrides: Partial<RecruitLog> = {}): RecruitLog {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    channel: null,
    createdAt: now,
    date: now,
    entryCount: 1,
    id: createTestUuid(),
    interviewCount: 3,
    offerCount: 2,
    phoneCount: 5,
    position: "Frontend Engineer",
    priority: null,
    problems: "Need more qualified candidates.",
    reflection: "Improve screening criteria.",
    resumeCount: 20,
    roleType: null,
    screenCount: 10,
    source: null,
    summary: "Normal recruiting day.",
    updatedAt: now,
    ...overrides
  };
}

export function createKnowledge(overrides: Partial<Knowledge> = {}): Knowledge {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    content: "Send a follow-up message within 24 hours.",
    createdAt: now,
    id: createTestUuid(),
    parsedOutput: null,
    rawOutput: null,
    source: "USER" satisfies KnowledgeSource,
    sourcePlanId: null,
    sourceReviewId: null,
    tags: ["interview", "follow-up"],
    title: "Interview follow-up template",
    type: "TEMPLATE" satisfies KnowledgeType,
    updatedAt: now,
    ...overrides
  };
}

function matchesKnowledgeQuery(
  knowledge: Knowledge,
  options: KnowledgeRepositoryQueryOptions
): boolean {
  if (options.type !== undefined && knowledge.type !== options.type) {
    return false;
  }

  if (options.tag !== undefined && !knowledge.tags.includes(options.tag)) {
    return false;
  }

  if (options.keyword !== undefined) {
    const keyword = options.keyword.toLowerCase();
    const titleMatches = knowledge.title.toLowerCase().includes(keyword);
    const contentMatches = knowledge.content.toLowerCase().includes(keyword);

    return titleMatches || contentMatches;
  }

  return true;
}

function createTestUuid(): string {
  const suffix = String(idSequence).padStart(12, "0");
  idSequence += 1;

  return `00000000-0000-4000-8000-${suffix}`;
}

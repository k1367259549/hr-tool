import type { KnowledgeSource, KnowledgeType, Prisma } from "@prisma/client";

export type Knowledge = {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  source: KnowledgeSource;
  tags: string[];
  sourceReviewId: string | null;
  sourcePlanId: string | null;
  rawOutput: Prisma.JsonValue | null;
  parsedOutput: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeDto = Omit<Knowledge, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeManualSource = "USER" | "AI";

export type KnowledgeCreateInput = {
  title: string;
  content: string;
  type: KnowledgeType;
  source: KnowledgeManualSource;
  tags: string[];
};

export type KnowledgeUpdateInput = Partial<KnowledgeCreateInput>;

export type KnowledgeQueryOptions = {
  type?: KnowledgeType;
  tag?: string;
  keyword?: string;
};

export type KnowledgeRepositoryQueryOptions = KnowledgeQueryOptions;

export type KnowledgeRepositoryCreateInput = KnowledgeCreateInput;

export type KnowledgeRepositoryUpdateInput = KnowledgeUpdateInput;

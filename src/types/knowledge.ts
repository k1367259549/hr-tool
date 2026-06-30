import type { KnowledgeSource, KnowledgeType, Prisma } from "@prisma/client";
import type { RecruitLogDateInput } from "@/types/log";

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

export type KnowledgeRepositoryCreateInput = {
  title: string;
  content: string;
  type: KnowledgeType;
  source: KnowledgeSource;
  tags: string[];
  sourceReviewId?: string | null;
  sourcePlanId?: string | null;
  rawOutput?: Prisma.InputJsonValue;
  parsedOutput?: Prisma.InputJsonValue;
};

export type KnowledgeRepositoryUpdateInput = Partial<KnowledgeRepositoryCreateInput>;

export type KnowledgeAiItem = {
  title: string;
  content: string;
  type: KnowledgeType;
  tags: string[];
};

export type KnowledgeAiOutput = {
  items: KnowledgeAiItem[];
};

export type KnowledgeExtractInput = {
  date: RecruitLogDateInput;
};

export type KnowledgeExtractPayload = {
  date: string;
};

export type KnowledgeFormValues = {
  title: string;
  content: string;
  type: KnowledgeType;
  source: KnowledgeManualSource;
  tagsText: string;
};

export type KnowledgeFilterValues = {
  keyword: string;
  type: KnowledgeType | "";
  tag: string;
};

export type KnowledgeFormMode = "create" | "edit";

export type KnowledgeListItem = KnowledgeDto & {
  contentPreview: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  tagsLabel: string;
};

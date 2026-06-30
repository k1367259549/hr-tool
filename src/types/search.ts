import type { Knowledge, RecruitLog } from "@prisma/client";

export type SearchResultType = "RecruitLog" | "Knowledge";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  title: string;
  content: string;
  url: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResultItem[];
};

export type SearchRepositoryResult = {
  logs: RecruitLog[];
  knowledgeEntries: Knowledge[];
};

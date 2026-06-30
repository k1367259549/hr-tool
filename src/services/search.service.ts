import { format } from "date-fns";
import { searchRepository } from "@/repositories/search.repository";
import type { SearchResponse, SearchResultItem } from "@/types/search";
import type { Knowledge, RecruitLog } from "@prisma/client";

const previewLength = 160;

export const searchService = {
  async search(rawQuery: string | null): Promise<SearchResponse> {
    const query = normalizeQuery(rawQuery);

    if (query.length === 0) {
      return {
        query,
        results: []
      };
    }

    const searchResults = await searchRepository.search(query);

    return {
      query,
      results: [
        ...searchResults.logs.map((log) => createLogResult(log)),
        ...searchResults.knowledgeEntries.map((entry) => createKnowledgeResult(entry))
      ]
    };
  }
};

function normalizeQuery(query: string | null): string {
  return (query ?? "").trim();
}

function createLogResult(log: RecruitLog): SearchResultItem {
  const dateLabel = format(log.date, "yyyy-MM-dd");

  return {
    id: log.id,
    type: "RecruitLog",
    title: `${dateLabel} 招聘记录`,
    content: createPreview([log.position, log.summary, log.problems, log.reflection]),
    url: "/log"
  };
}

function createKnowledgeResult(entry: Knowledge): SearchResultItem {
  return {
    id: entry.id,
    type: "Knowledge",
    title: entry.title,
    content: createPreview([entry.content, entry.tags.join(", ")]),
    url: "/knowledge"
  };
}

function createPreview(parts: Array<string | null>): string {
  const previewSource = parts
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" ");

  if (previewSource.length <= previewLength) {
    return previewSource;
  }

  return `${previewSource.slice(0, previewLength).trim()}...`;
}

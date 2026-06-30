"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { ApiResponse } from "@/types/api";
import type { SearchResponse, SearchResultItem } from "@/types/search";

export default function SearchPage(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [searchData, setSearchData] = useState<SearchResponse>({ query: "", results: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSearched = searchData.query.length > 0 || errorMessage !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const nextQuery = query.trim();
    setErrorMessage(null);

    if (nextQuery.length === 0) {
      setSearchData({
        query: "",
        results: []
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(nextQuery)}`);
      const payload = (await response.json()) as ApiResponse<SearchResponse>;

      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      setSearchData(payload.data);
    } catch (error) {
      setSearchData({
        query: nextQuery,
        results: []
      });
      setErrorMessage(error instanceof Error ? error.message : "搜索失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="全局搜索"
        description="搜索每日招聘记录和可复用知识条目。"
      />

      <SectionCard title="全局搜索" description="查找匹配的记录和知识。">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void handleSubmit(event)}>
          <label className="sr-only" htmlFor="global-search-query">
            搜索关键词
          </label>
          <input
            id="global-search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入关键词"
            className="min-h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          />
          <button
            type="submit"
            className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
          >
            {isLoading ? "搜索中" : "搜索"}
          </button>
        </form>
      </SectionCard>

      {isLoading ? (
        <LoadingState title="搜索中" description="正在检索记录和知识条目。" />
      ) : errorMessage ? (
        <ErrorState
          title="无法完成搜索"
          message={errorMessage}
          actionLabel="清空"
          onAction={() => {
            setErrorMessage(null);
            setSearchData({
              query: "",
              results: []
            });
          }}
        />
      ) : searchData.results.length > 0 ? (
        <SearchResults query={searchData.query} results={searchData.results} />
      ) : hasSearched ? (
        <EmptyState
          title="未找到结果"
          description="可以换一个关键词，或检查是否已有匹配的记录和知识条目。"
        />
      ) : (
        <EmptyState
          title="搜索已就绪"
          description="输入关键词后即可搜索每日记录和知识库。"
        />
      )}
    </div>
  );
}

type SearchResultsProps = {
  query: string;
  results: SearchResultItem[];
};

function SearchResults({ query, results }: SearchResultsProps): JSX.Element {
  return (
    <SectionCard
      title="搜索结果"
      description={`找到 ${results.length} 条与“${query}”相关的结果。`}
    >
      <div className="divide-y divide-slate-200">
        {results.map((result) => (
          <SearchResultRow key={`${result.type}-${result.id}`} result={result} />
        ))}
      </div>
    </SectionCard>
  );
}

type SearchResultRowProps = {
  result: SearchResultItem;
};

function SearchResultRow({ result }: SearchResultRowProps): JSX.Element {
  return (
    <article className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
            {getSearchResultTypeLabel(result.type)}
          </span>
          <h2 className="text-base font-semibold text-slate-950">{result.title}</h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">{result.content || "暂无预览。"}</p>
      </div>
      <Link
        href={result.url}
        className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      >
        打开
      </Link>
    </article>
  );
}

function getSearchResultTypeLabel(type: SearchResultItem["type"]): string {
  const labels: Record<SearchResultItem["type"], string> = {
    Knowledge: "知识",
    RecruitLog: "每日记录"
  };

  return labels[type];
}

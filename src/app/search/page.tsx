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
      setErrorMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Search"
        description="Search daily recruiting logs and reusable knowledge entries."
      />

      <SectionCard title="Global Search" description="Find matching logs and knowledge records.">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void handleSubmit(event)}>
          <label className="sr-only" htmlFor="global-search-query">
            Search keyword
          </label>
          <input
            id="global-search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by keyword"
            className="min-h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          />
          <button
            type="submit"
            className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
          >
            {isLoading ? "Searching" : "Search"}
          </button>
        </form>
      </SectionCard>

      {isLoading ? (
        <LoadingState title="Searching" description="Looking across logs and knowledge entries." />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to search"
          message={errorMessage}
          action={
            <button
              type="button"
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={() => {
                setErrorMessage(null);
                setSearchData({
                  query: "",
                  results: []
                });
              }}
            >
              Clear
            </button>
          }
        />
      ) : searchData.results.length > 0 ? (
        <SearchResults query={searchData.query} results={searchData.results} />
      ) : hasSearched ? (
        <EmptyState
          title="No results found"
          description="Try a different keyword or check whether matching logs and knowledge entries exist."
        />
      ) : (
        <EmptyState
          title="Search is ready"
          description="Enter a keyword to search RecruitLog and Knowledge records."
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
      title="Search Results"
      description={`${results.length} result${results.length === 1 ? "" : "s"} for "${query}".`}
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
            {result.type}
          </span>
          <h2 className="text-base font-semibold text-slate-950">{result.title}</h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">{result.content || "No preview available."}</p>
      </div>
      <Link
        href={result.url}
        className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      >
        Open
      </Link>
    </article>
  );
}

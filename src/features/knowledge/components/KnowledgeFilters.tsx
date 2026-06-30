"use client";

import { FormField } from "@/components/shared/FormField";
import { PageActions } from "@/components/shared/PageActions";
import { SectionCard } from "@/components/shared/SectionCard";
import type { KnowledgeFilterValues } from "@/types/knowledge";
import type { KnowledgeType } from "@prisma/client";

type KnowledgeFiltersProps = {
  filters: KnowledgeFilterValues;
  typeOptions: KnowledgeType[];
  isLoading: boolean;
  onFilterChange: (field: keyof KnowledgeFilterValues, value: string) => void;
  onCreate: () => void;
  onRefresh: () => Promise<void>;
};

export function KnowledgeFilters({
  filters,
  typeOptions,
  isLoading,
  onFilterChange,
  onCreate,
  onRefresh
}: KnowledgeFiltersProps): JSX.Element {
  return (
    <SectionCard
      title="知识筛选"
      description="搜索并筛选可复用的招聘知识条目。"
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onRefresh()}
            disabled={isLoading}
          >
            {isLoading ? "加载中..." : "刷新"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={onCreate}
          >
            新建
          </button>
        </PageActions>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <FormField id="knowledge-keyword" label="搜索">
          <input
            id="knowledge-keyword"
            type="search"
            value={filters.keyword}
            onChange={(event) => onFilterChange("keyword", event.target.value)}
            placeholder="搜索标题或内容"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
        <FormField id="knowledge-type-filter" label="类型">
          <select
            id="knowledge-type-filter"
            value={filters.type}
            onChange={(event) => onFilterChange("type", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">全部类型</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {getKnowledgeTypeLabel(type)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="knowledge-tag-filter" label="标签">
          <input
            id="knowledge-tag-filter"
            type="text"
            value={filters.tag}
            onChange={(event) => onFilterChange("tag", event.target.value)}
            placeholder="interview"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
      </div>
    </SectionCard>
  );
}

function getKnowledgeTypeLabel(type: KnowledgeType): string {
  const labels: Record<KnowledgeType, string> = {
    EXPERIENCE: "经验",
    NOTE: "笔记",
    POSITION: "岗位",
    TEMPLATE: "模板"
  };

  return labels[type];
}

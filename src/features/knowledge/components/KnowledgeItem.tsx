"use client";

import type { KnowledgeListItem } from "@/types/knowledge";

type KnowledgeItemProps = {
  entry: KnowledgeListItem;
  onEdit: (entry: KnowledgeListItem) => Promise<void>;
  onDelete: (entry: KnowledgeListItem) => void;
};

export function KnowledgeItem({ entry, onEdit, onDelete }: KnowledgeItemProps): JSX.Element {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
              {getKnowledgeTypeLabel(entry.type)}
            </span>
            <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
              {getKnowledgeSourceLabel(entry.source)}
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950">{entry.title}</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
              {entry.contentPreview}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.tags.length > 0 ? (
              entry.tags.map((tag) => (
                <span
                  key={`${entry.id}-${tag}`}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">{entry.tagsLabel}</span>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            创建于 {entry.createdAtLabel} · 更新于 {entry.updatedAtLabel}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => void onEdit(entry)}
          >
            编辑
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            onClick={() => onDelete(entry)}
          >
            删除
          </button>
        </div>
      </div>
    </article>
  );
}

function getKnowledgeTypeLabel(type: KnowledgeListItem["type"]): string {
  const labels: Record<KnowledgeListItem["type"], string> = {
    EXPERIENCE: "经验",
    NOTE: "笔记",
    POSITION: "岗位",
    TEMPLATE: "模板"
  };

  return labels[type];
}

function getKnowledgeSourceLabel(source: KnowledgeListItem["source"]): string {
  return source === "USER" ? "用户" : "AI";
}

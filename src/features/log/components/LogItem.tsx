"use client";

import type { RecruitLogDto } from "@/types/log";

type LogItemProps = {
  log: RecruitLogDto;
  isSelected: boolean;
  onSelect: (log: RecruitLogDto) => void;
};

export function LogItem({ log, isSelected, onSelect }: LogItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(log)}
      className={`w-full rounded-md border p-4 text-left transition-colors ${
        isSelected
          ? "border-slate-900 bg-slate-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{formatDate(log.date)}</p>
          <p className="mt-1 text-sm text-slate-500">{log.position || "未填写职位"}</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
          {log.resumeCount} 份简历
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div>
          <dt>筛选</dt>
          <dd className="font-semibold text-slate-900">{log.screenCount}</dd>
        </div>
        <div>
          <dt>面试</dt>
          <dd className="font-semibold text-slate-900">{log.interviewCount}</dd>
        </div>
        <div>
          <dt>Offer</dt>
          <dd className="font-semibold text-slate-900">{log.offerCount}</dd>
        </div>
      </dl>
    </button>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

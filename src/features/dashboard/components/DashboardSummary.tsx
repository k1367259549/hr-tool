"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import { SectionCard } from "@/components/shared/SectionCard";
import type {
  DashboardRangeOptionView,
  DashboardRangeSummaryView,
  DashboardTimeRange
} from "@/types/dashboard";

type DashboardSummaryProps = {
  summary: DashboardRangeSummaryView;
  rangeOptions: DashboardRangeOptionView[];
  selectedRange: DashboardTimeRange;
  onRangeChange: (range: DashboardTimeRange) => void;
};

export function DashboardSummary({
  summary,
  rangeOptions,
  selectedRange,
  onRangeChange
}: DashboardSummaryProps): JSX.Element {
  return (
    <SectionCard title={summary.title} description={summary.description}>
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {rangeOptions.map((option) => {
            const isSelected = option.id === selectedRange;

            return (
              <button
                key={option.id}
                type="button"
                className={`rounded-md border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-slate-950 bg-slate-100"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => onRangeChange(option.id)}
              >
                <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {option.logCountLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-950">当前范围</p>
          <span className="w-fit rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
            {summary.logCountLabel}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.metrics.map((metric) => (
            <KpiCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              description={metric.description}
              footer={metric.footer}
              tone={metric.tone}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

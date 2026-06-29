"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import type { DashboardRangeSummaryView } from "@/types/dashboard";

type DashboardSummaryProps = {
  summaries: DashboardRangeSummaryView[];
};

export function DashboardSummary({ summaries }: DashboardSummaryProps): JSX.Element {
  return (
    <div className="space-y-6">
      {summaries.map((summary) => (
        <section key={summary.id} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-950">{summary.title}</h2>
              <p className="text-sm leading-6 text-slate-500">{summary.description}</p>
            </div>
            <div className="shrink-0">
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                {summary.logCountLabel}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.metrics.map((metric) => (
              <KpiCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                description={metric.description}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

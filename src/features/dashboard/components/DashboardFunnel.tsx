"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { DashboardFunnelStageView } from "@/types/dashboard";

type DashboardFunnelProps = {
  stages: DashboardFunnelStageView[];
  rangeLabel: string;
};

export function DashboardFunnel({ stages, rangeLabel }: DashboardFunnelProps): JSX.Element {
  const hasData = stages.some((stage) => stage.value > 0);

  return (
    <SectionCard
      title="Recruiting Funnel"
      description={`Resume to entry movement for ${rangeLabel}.`}
    >
      {!hasData ? (
        <EmptyState
          title="No funnel data"
          description="Create recruiting logs to see funnel movement."
          className="min-h-72"
        />
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{stage.label}</p>
                  <p className="text-xs text-slate-500">{stage.previousRateLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{stage.valueLabel}</p>
                  <p className="text-xs text-slate-500">{stage.rateLabel}</p>
                </div>
              </div>
              <meter
                className="h-4 w-full overflow-hidden rounded-md"
                min={0}
                max={stage.maxValue}
                value={stage.value}
                aria-label={`${stage.label} funnel value`}
              />
              </div>
              {index < stages.length - 1 ? (
                <div className="flex justify-center py-1 text-sm font-semibold text-slate-400">
                  ↓
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

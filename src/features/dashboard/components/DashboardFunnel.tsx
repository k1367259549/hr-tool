"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { DashboardFunnelStageView } from "@/types/dashboard";

type DashboardFunnelProps = {
  stages: DashboardFunnelStageView[];
};

export function DashboardFunnel({ stages }: DashboardFunnelProps): JSX.Element {
  const hasData = stages.some((stage) => stage.value > 0);

  return (
    <SectionCard
      title="Recruiting Funnel Overview"
      description="Monthly funnel movement from resumes to entries."
    >
      {!hasData ? (
        <EmptyState
          title="No funnel data"
          description="Create recruiting logs to see funnel movement."
          className="min-h-72"
        />
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{stage.label}</p>
                  <p className="text-xs text-slate-500">{stage.rateLabel}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{stage.valueLabel}</p>
              </div>
              <meter
                className="h-4 w-full overflow-hidden rounded-md"
                min={0}
                max={stage.maxValue}
                value={stage.value}
                aria-label={`${stage.label} funnel value`}
              />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

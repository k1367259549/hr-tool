"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { RecruitLogDto } from "@/types/log";
import { LogItem } from "./LogItem";

type LogListProps = {
  logs: RecruitLogDto[];
  selectedLogId: string | null;
  isLoading: boolean;
  onSelect: (log: RecruitLogDto) => void;
  onRefresh: () => Promise<void>;
};

export function LogList({
  logs,
  selectedLogId,
  isLoading,
  onSelect,
  onRefresh
}: LogListProps): JSX.Element {
  return (
    <SectionCard
      title="Log History"
      description="Select an existing log to view or edit it."
      actions={
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onRefresh()}
          disabled={isLoading}
        >
          Refresh
        </button>
      }
    >
      {isLoading ? (
        <LoadingState title="Loading logs" description="Fetching daily recruiting logs." />
      ) : logs.length === 0 ? (
        <EmptyState title="No logs yet" description="Create the first daily log from the form." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              isSelected={log.id === selectedLogId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

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
      title="记录历史"
      description="选择已有记录进行查看或编辑。"
      actions={
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onRefresh()}
          disabled={isLoading}
        >
          刷新
        </button>
      }
    >
      {isLoading ? (
        <LoadingState title="正在加载记录" description="正在获取每日招聘记录。" />
      ) : logs.length === 0 ? (
        <EmptyState title="暂无记录" description="请先在表单中创建第一条每日记录。" />
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

"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { KnowledgeListItem } from "@/types/knowledge";
import { KnowledgeItem } from "./KnowledgeItem";

type KnowledgeListProps = {
  entries: KnowledgeListItem[];
  isLoading: boolean;
  onEdit: (entry: KnowledgeListItem) => Promise<void>;
  onDelete: (entry: KnowledgeListItem) => void;
};

export function KnowledgeList({
  entries,
  isLoading,
  onEdit,
  onDelete
}: KnowledgeListProps): JSX.Element {
  return (
    <SectionCard title="知识列表" description="可复用的招聘笔记和模板。">
      {isLoading ? (
        <LoadingState title="正在加载知识" description="正在获取知识条目。" />
      ) : entries.length === 0 ? (
        <EmptyState
          title="未找到知识条目"
          description="可以新建条目，或调整搜索和筛选条件。"
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <KnowledgeItem
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

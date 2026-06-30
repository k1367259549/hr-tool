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
    <SectionCard title="Knowledge List" description="Reusable recruiting notes and templates.">
      {isLoading ? (
        <LoadingState title="Loading knowledge" description="Fetching knowledge entries." />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No knowledge entries found"
          description="Create a new entry or adjust the search and filter values."
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

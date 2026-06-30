import type { KnowledgeDto, KnowledgeListItem } from "@/types/knowledge";

export function createKnowledgeListItem(entry: KnowledgeDto): KnowledgeListItem {
  return {
    ...entry,
    contentPreview: createContentPreview(entry.content),
    createdAtLabel: formatDateTime(entry.createdAt),
    updatedAtLabel: formatDateTime(entry.updatedAt),
    tagsLabel: entry.tags.length > 0 ? entry.tags.join(", ") : "No tags"
  };
}

function createContentPreview(content: string): string {
  const trimmedContent = content.trim();

  if (trimmedContent.length <= 180) {
    return trimmedContent;
  }

  return `${trimmedContent.slice(0, 177)}...`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

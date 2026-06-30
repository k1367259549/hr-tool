"use client";

import type { ApiResponse } from "@/types/api";
import type {
  KnowledgeCreateInput,
  KnowledgeDto,
  KnowledgeFilterValues,
  KnowledgeUpdateInput
} from "@/types/knowledge";

export async function getKnowledgeEntries(
  filters: KnowledgeFilterValues
): Promise<KnowledgeDto[]> {
  return requestApi<KnowledgeDto[]>(buildKnowledgeListPath(filters));
}

export async function getKnowledgeEntry(id: string): Promise<KnowledgeDto> {
  return requestApi<KnowledgeDto>(`/api/knowledge/${id}`);
}

export async function createKnowledgeEntry(input: KnowledgeCreateInput): Promise<KnowledgeDto> {
  return requestApi<KnowledgeDto>("/api/knowledge", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateKnowledgeEntry(
  id: string,
  input: KnowledgeUpdateInput
): Promise<KnowledgeDto> {
  return requestApi<KnowledgeDto>(`/api/knowledge/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteKnowledgeEntry(id: string): Promise<KnowledgeDto> {
  return requestApi<KnowledgeDto>(`/api/knowledge/${id}`, {
    method: "DELETE"
  });
}

function buildKnowledgeListPath(filters: KnowledgeFilterValues): string {
  const searchParams = new URLSearchParams();

  if (filters.keyword.trim().length > 0) {
    searchParams.set("keyword", filters.keyword.trim());
  }

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.tag.trim().length > 0) {
    searchParams.set("tag", filters.tag.trim());
  }

  const queryString = searchParams.toString();

  return queryString ? `/api/knowledge?${queryString}` : "/api/knowledge";
}

async function requestApi<TData>(path: string, init: RequestInit = {}): Promise<TData> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

import type { KnowledgeSource, KnowledgeType } from "@prisma/client";
import type {
  KnowledgeCreateInput,
  KnowledgeQueryOptions,
  KnowledgeUpdateInput
} from "@/types/knowledge";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const knowledgeTypes: KnowledgeType[] = ["EXPERIENCE", "TEMPLATE", "POSITION", "NOTE"];
const manualKnowledgeSources: KnowledgeSource[] = ["USER", "AI"];

export class KnowledgeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeValidationError";
  }
}

export function validateKnowledgeId(id: string): void {
  if (!uuidPattern.test(id)) {
    throw new KnowledgeValidationError("ID must be a valid UUID.");
  }
}

export function parseKnowledgeCreatePayload(payload: unknown): KnowledgeCreateInput {
  const body = assertRecord(payload);
  const title = readRequiredString(body, "title");
  const content = readRequiredString(body, "content");
  const type = readKnowledgeType(body.type);
  const source = readManualKnowledgeSource(body.source);
  const tags = readTags(body.tags);

  return {
    title,
    content,
    type,
    source,
    tags
  };
}

export function parseKnowledgeUpdatePayload(payload: unknown): KnowledgeUpdateInput {
  const body = assertRecord(payload);

  return {
    title: readOptionalString(body, "title"),
    content: readOptionalString(body, "content"),
    type: body.type === undefined ? undefined : readKnowledgeType(body.type),
    source: body.source === undefined ? undefined : readManualKnowledgeSource(body.source),
    tags: body.tags === undefined ? undefined : readTags(body.tags)
  };
}

export function normalizeKnowledgeQueryOptions(input: {
  type?: string;
  tag?: string;
  keyword?: string;
}): KnowledgeQueryOptions {
  return {
    type: input.type === undefined ? undefined : readKnowledgeType(input.type),
    tag: normalizeOptionalQueryText(input.tag),
    keyword: normalizeOptionalQueryText(input.keyword)
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new KnowledgeValidationError("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function readRequiredString(source: Record<string, unknown>, field: "title" | "content"): string {
  const value = source[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new KnowledgeValidationError(`${field} is required.`);
  }

  return value.trim();
}

function readOptionalString(
  source: Record<string, unknown>,
  field: "title" | "content"
): string | undefined {
  const value = source[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new KnowledgeValidationError(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function readKnowledgeType(value: unknown): KnowledgeType {
  if (typeof value === "string" && knowledgeTypes.includes(value as KnowledgeType)) {
    return value as KnowledgeType;
  }

  throw new KnowledgeValidationError("type must be one of EXPERIENCE, TEMPLATE, POSITION, NOTE.");
}

function readManualKnowledgeSource(value: unknown): "USER" | "AI" {
  if (typeof value === "string" && manualKnowledgeSources.includes(value as KnowledgeSource)) {
    return value as "USER" | "AI";
  }

  throw new KnowledgeValidationError("source must be one of USER, AI.");
}

function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new KnowledgeValidationError("tags must be an array of strings.");
  }

  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new KnowledgeValidationError("tags must be an array of non-empty strings.");
    }

    return item.trim();
  });
}

function normalizeOptionalQueryText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

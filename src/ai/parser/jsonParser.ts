import type { AiErrorCode, JsonValue } from "@/types/ai";

export class JsonParserError extends Error {
  readonly code: AiErrorCode;

  constructor(message: string) {
    super(message);
    this.name = "JsonParserError";
    this.code = "JSON_PARSE_ERROR";
  }
}

export function parseJsonOutput<TJson extends JsonValue = JsonValue>(output: string): TJson {
  const normalizedOutput = normalizeJsonOutput(output);

  try {
    return JSON.parse(normalizedOutput) as TJson;
  } catch {
    throw new JsonParserError("AI output must be valid JSON.");
  }
}

function normalizeJsonOutput(output: string): string {
  const trimmedOutput = output.trim();
  const fencedJsonMatch = trimmedOutput.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  const unfencedOutput = fencedJsonMatch?.[1]?.trim() ?? trimmedOutput;
  const firstObjectIndex = unfencedOutput.indexOf("{");
  const lastObjectIndex = unfencedOutput.lastIndexOf("}");

  if (firstObjectIndex >= 0 && lastObjectIndex > firstObjectIndex) {
    return unfencedOutput.slice(firstObjectIndex, lastObjectIndex + 1).trim();
  }

  return unfencedOutput;
}

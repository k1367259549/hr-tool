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
  try {
    return JSON.parse(output) as TJson;
  } catch {
    throw new JsonParserError("AI output must be valid JSON.");
  }
}

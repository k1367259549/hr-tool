import { createHash } from "node:crypto";
import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateSpreadsheetAnalysisAiOutput } from "@/ai/schemas/spreadsheetAnalysis.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { spreadsheetAnalysisRepository } from "@/repositories/spreadsheetAnalysis.repository";
import { spreadsheetRepository } from "@/repositories/spreadsheet.repository";
import { toAnalysisDto, toUploadDto } from "@/services/spreadsheet.service";
import type { JsonObject, JsonValue } from "@/types/ai";
import type {
  NormalizedRecruitingRow,
  ParsedSpreadsheet,
  SpreadsheetAnalysisAiOutput,
  SpreadsheetAnalysisPreview,
  SpreadsheetColumnMapping,
  SpreadsheetKpiSummary,
  SpreadsheetAnalysisReport
} from "@/types/spreadsheet";
import { mapSpreadsheetColumns } from "@/utils/spreadsheetColumnMapper";
import { extractSpreadsheetKpis } from "@/utils/spreadsheetKpiExtractor";
import { normalizeSpreadsheetRows } from "@/utils/spreadsheetNormalizer";
import { parseSpreadsheetFile } from "@/utils/spreadsheetParser";
import { validateSpreadsheetFile } from "@/utils/spreadsheetValidation";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";

const spreadsheetAnalysisPromptFile = "spreadsheet-analysis.md";
const previewRowLimit = 20;
const fullAiInputRowLimit = 100;
const largeSpreadsheetEdgeSampleLimit = 20;
const representativeSampleLimit = 20;

export type SpreadsheetAnalysisServiceErrorCode =
  | "AI_ANALYSIS_ERROR"
  | "SPREADSHEET_PARSE_ERROR"
  | "VALIDATION_ERROR";

export class SpreadsheetAnalysisServiceError extends Error {
  readonly code: SpreadsheetAnalysisServiceErrorCode;

  constructor(code: SpreadsheetAnalysisServiceErrorCode, message: string) {
    super(message);
    this.name = "SpreadsheetAnalysisServiceError";
    this.code = code;
  }
}

export const spreadsheetAnalysisService = {
  async analyzeUploadedFile(file: File | null): Promise<SpreadsheetAnalysisReport> {
    const fileType = validateSpreadsheetFile(file);

    if (!file) {
      throw new SpreadsheetAnalysisServiceError("VALIDATION_ERROR", "请上传文件。");
    }

    const parsedSpreadsheet = await parseSpreadsheetFile(file, fileType);
    const columnMappingResult = mapSpreadsheetColumns(parsedSpreadsheet.headers);
    const normalizedRows = normalizeSpreadsheetRows(parsedSpreadsheet, columnMappingResult.mappings);
    const kpis = extractSpreadsheetKpis(normalizedRows);
    const upload = await spreadsheetRepository.create({
      fileName: file.name,
      fileType,
      rowCount: parsedSpreadsheet.rowCount,
      status: "COMPLETED"
    });
    const promptInput = createPromptInput({
      fileName: file.name,
      fileType,
      parsedSpreadsheet,
      normalizedRows,
      kpis,
      columnMappings: columnMappingResult.mappings
    });
    const rawOutput = await generateAnalysisOutput(promptInput);
    const aiOutput = parseAndValidateAnalysisOutput(rawOutput);
    const analysis = await spreadsheetAnalysisRepository.create({
      uploadId: upload.id,
      summary: aiOutput.summary,
      insights: aiOutput.insights,
      problems: aiOutput.problems,
      suggestions: aiOutput.suggestions,
      rawJson: {
        inputHash: createInputHash(promptInput),
        output: aiOutput
      },
      model: aiConfig.defaultModel
    });

    return {
      upload: toUploadDto(upload),
      analysis: toAnalysisDto(analysis),
      preview: createSpreadsheetPreview({
        parsedSpreadsheet,
        normalizedRows,
        kpis,
        detectedColumns: columnMappingResult.detectedColumns,
        columnMappings: columnMappingResult.mappings
      })
    };
  }
};

async function generateAnalysisOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "spreadsheet_analysis",
      promptFile: spreadsheetAnalysisPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch (error) {
    throw new SpreadsheetAnalysisServiceError(
      "AI_ANALYSIS_ERROR",
      getSafeAiErrorMessage(error, "AI 表格分析失败。")
    );
  }
}

function parseAndValidateAnalysisOutput(rawOutput: string): SpreadsheetAnalysisAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateSpreadsheetAnalysisAiOutput(parsedJson);
  } catch {
    throw new SpreadsheetAnalysisServiceError("AI_ANALYSIS_ERROR", "AI 表格分析输出无效。");
  }
}

type CreatePromptInputParams = {
  fileName: string;
  fileType: string;
  parsedSpreadsheet: ParsedSpreadsheet;
  normalizedRows: NormalizedRecruitingRow[];
  kpis: SpreadsheetKpiSummary;
  columnMappings: SpreadsheetColumnMapping[];
};

function createPromptInput({
  fileName,
  fileType,
  parsedSpreadsheet,
  normalizedRows,
  kpis,
  columnMappings
}: CreatePromptInputParams): JsonObject {
  const isCompleteDataset = parsedSpreadsheet.rowCount <= fullAiInputRowLimit;

  return {
    metadata: {
      fileName,
      fileType,
      rowCount: parsedSpreadsheet.rowCount,
      headers: parsedSpreadsheet.headers,
      isCompleteDataset,
      samplingStrategy: isCompleteDataset
        ? "all_normalized_rows"
        : "kpi_summary_first_20_last_20_representative_samples"
    },
    columnMappings,
    kpis,
    sampleRows: serializeNormalizedRows(createSampleRows(normalizedRows)),
    normalizedRows: isCompleteDataset ? serializeNormalizedRows(normalizedRows) : []
  };
}

type CreateSpreadsheetPreviewParams = {
  parsedSpreadsheet: ParsedSpreadsheet;
  normalizedRows: NormalizedRecruitingRow[];
  kpis: SpreadsheetKpiSummary;
  detectedColumns: SpreadsheetAnalysisPreview["detectedColumns"];
  columnMappings: SpreadsheetColumnMapping[];
};

function createSpreadsheetPreview({
  parsedSpreadsheet,
  normalizedRows,
  kpis,
  detectedColumns,
  columnMappings
}: CreateSpreadsheetPreviewParams): SpreadsheetAnalysisPreview {
  return {
    headers: parsedSpreadsheet.headers,
    rowCount: parsedSpreadsheet.rowCount,
    rows: parsedSpreadsheet.rows.slice(0, previewRowLimit),
    detectedColumns,
    columnMappings,
    kpis,
    missingFieldWarnings: createMissingFieldWarnings(kpis),
    normalizedRows: normalizedRows.slice(0, previewRowLimit)
  };
}

function createSampleRows(rows: NormalizedRecruitingRow[]): NormalizedRecruitingRow[] {
  if (rows.length <= fullAiInputRowLimit) {
    return rows;
  }

  const sampleMap = new Map<number, NormalizedRecruitingRow>();
  const firstRows = rows.slice(0, largeSpreadsheetEdgeSampleLimit);
  const lastRows = rows.slice(-largeSpreadsheetEdgeSampleLimit);
  const representativeRows = createRepresentativeSamples(rows, representativeSampleLimit);

  [...firstRows, ...lastRows, ...representativeRows].forEach((row) => {
    const index = rows.indexOf(row);

    if (index >= 0) {
      sampleMap.set(index, row);
    }
  });

  return [...sampleMap.entries()]
    .sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex)
    .map(([, row]) => row);
}

function createRepresentativeSamples(
  rows: NormalizedRecruitingRow[],
  limit: number
): NormalizedRecruitingRow[] {
  if (rows.length <= limit) {
    return rows;
  }

  const interval = Math.max(1, Math.floor(rows.length / limit));
  const samples: NormalizedRecruitingRow[] = [];

  for (let index = 0; index < rows.length && samples.length < limit; index += interval) {
    const row = rows[index];

    if (row) {
      samples.push(row);
    }
  }

  return samples;
}

function createMissingFieldWarnings(kpis: SpreadsheetKpiSummary): string[] {
  return Object.entries(kpis.missingFieldCounts)
    .filter(([, count]) => count > 0)
    .map(([field, count]) => `${field}: ${count} 行缺失`);
}

function serializeNormalizedRows(rows: NormalizedRecruitingRow[]): JsonObject[] {
  return rows.map((row) => {
    const serializedRow: JsonObject = {
      raw: serializeRawRow(row.raw)
    };

    if (row.candidateName) {
      serializedRow.candidateName = row.candidateName;
    }

    if (row.position) {
      serializedRow.position = row.position;
    }

    if (row.source) {
      serializedRow.source = row.source;
    }

    if (row.status) {
      serializedRow.status = row.status;
    }

    if (row.interviewDate) {
      serializedRow.interviewDate = row.interviewDate;
    }

    if (row.result) {
      serializedRow.result = row.result;
    }

    return serializedRow;
  });
}

function serializeRawRow(row: Record<string, unknown>): JsonObject {
  return Object.entries(row).reduce<JsonObject>((serializedRow, [key, value]) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      serializedRow[key] = value;
      return serializedRow;
    }

    serializedRow[key] = value === null || value === undefined ? null : String(value);

    return serializedRow;
  }, {});
}

function createInputHash(input: JsonObject): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

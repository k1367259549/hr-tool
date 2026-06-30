import Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  ParsedSpreadsheet,
  ParsedSpreadsheetCell,
  ParsedSpreadsheetRow,
  SpreadsheetFileType
} from "@/types/spreadsheet";

export class SpreadsheetParseError extends Error {
  readonly code = "SPREADSHEET_PARSE_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "SpreadsheetParseError";
  }
}

export async function parseSpreadsheetFile(
  file: File,
  fileType: SpreadsheetFileType
): Promise<ParsedSpreadsheet> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsedSpreadsheet =
    fileType === "csv" ? parseCsv(buffer.toString("utf8")) : parseXlsx(buffer);

  if (parsedSpreadsheet.rowCount === 0) {
    throw new SpreadsheetParseError("表格没有可分析的数据行。");
  }

  return parsedSpreadsheet;
}

function parseCsv(content: string): ParsedSpreadsheet {
  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader
  });

  if (result.errors.length > 0) {
    throw new SpreadsheetParseError("CSV 文件解析失败。");
  }

  const rows = result.data
    .map(normalizeRow)
    .filter((row) => Object.values(row).some((value) => value !== null));
  const headers = getHeadersFromRows(rows);

  return {
    headers,
    rows,
    rowCount: rows.length
  };
}

function parseXlsx(buffer: Buffer): ParsedSpreadsheet {
  try {
    const workbook = XLSX.read(buffer, {
      cellDates: true,
      type: "buffer"
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new SpreadsheetParseError("Excel 文件没有工作表。");
    }

    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new SpreadsheetParseError("Excel 工作表读取失败。");
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: null,
      raw: false
    });
    const rows = rawRows
      .map(normalizeRow)
      .filter((row) => Object.values(row).some((value) => value !== null));
    const headers = getHeadersFromRows(rows);

    return {
      headers,
      rows,
      rowCount: rows.length
    };
  } catch (error) {
    if (error instanceof SpreadsheetParseError) {
      throw error;
    }

    throw new SpreadsheetParseError("Excel 文件解析失败。");
  }
}

function normalizeRow(row: Record<string, unknown>): ParsedSpreadsheetRow {
  return Object.entries(row).reduce<ParsedSpreadsheetRow>((normalizedRow, [key, value]) => {
    const header = normalizeHeader(key);

    if (!header) {
      return normalizedRow;
    }

    normalizedRow[header] = normalizeCellValue(value);

    return normalizedRow;
  }, {});
}

function normalizeHeader(header: string): string {
  return header.trim();
}

function normalizeCellValue(value: unknown): ParsedSpreadsheetCell {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      return null;
    }

    const numericValue = Number(normalizedValue);

    if (normalizedValue !== "" && Number.isFinite(numericValue)) {
      return numericValue;
    }

    return normalizedValue;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function getHeadersFromRows(rows: ParsedSpreadsheetRow[]): string[] {
  const headers = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((header) => headers.add(header));
  });

  return [...headers];
}


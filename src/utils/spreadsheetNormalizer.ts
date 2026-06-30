import type {
  NormalizedRecruitingField,
  NormalizedRecruitingRow,
  ParsedSpreadsheet,
  SpreadsheetColumnMapping
} from "@/types/spreadsheet";

export function normalizeSpreadsheetRows(
  parsedSpreadsheet: ParsedSpreadsheet,
  mappings: SpreadsheetColumnMapping[]
): NormalizedRecruitingRow[] {
  return parsedSpreadsheet.rows.map((row) => {
    const normalizedRow: NormalizedRecruitingRow = {
      raw: row
    };

    mappings.forEach((mapping) => {
      const value = formatNormalizedValue(row[mapping.header]);

      if (value) {
        normalizedRow[mapping.field] = value;
      }
    });

    return normalizedRow;
  });
}

export function getNormalizedRecruitingFields(): NormalizedRecruitingField[] {
  return ["candidateName", "position", "source", "status", "interviewDate", "result"];
}

function formatNormalizedValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalizedValue = String(value).trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

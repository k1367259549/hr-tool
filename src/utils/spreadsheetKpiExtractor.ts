import type {
  NormalizedRecruitingField,
  NormalizedRecruitingRow,
  SpreadsheetKpiSummary,
  SpreadsheetMissingFieldCounts
} from "@/types/spreadsheet";
import { getNormalizedRecruitingFields } from "@/utils/spreadsheetNormalizer";

export function extractSpreadsheetKpis(rows: NormalizedRecruitingRow[]): SpreadsheetKpiSummary {
  return {
    totalRows: rows.length,
    positionCounts: countFieldValues(rows, "position"),
    sourceCounts: countFieldValues(rows, "source"),
    statusCounts: countFieldValues(rows, "status"),
    resultCounts: countFieldValues(rows, "result"),
    missingFieldCounts: countMissingFields(rows)
  };
}

function countFieldValues(
  rows: NormalizedRecruitingRow[],
  field: NormalizedRecruitingField
): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const value = row[field];

    if (!value) {
      return counts;
    }

    counts[value] = (counts[value] ?? 0) + 1;

    return counts;
  }, {});
}

function countMissingFields(rows: NormalizedRecruitingRow[]): SpreadsheetMissingFieldCounts {
  const fields = getNormalizedRecruitingFields();
  const counts = fields.reduce<SpreadsheetMissingFieldCounts>((fieldCounts, field) => {
    fieldCounts[field] = 0;

    return fieldCounts;
  }, {} as SpreadsheetMissingFieldCounts);

  rows.forEach((row) => {
    fields.forEach((field) => {
      if (!row[field]) {
        counts[field] += 1;
      }
    });
  });

  return counts;
}

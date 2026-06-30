import type {
  NormalizedRecruitingField,
  SpreadsheetColumnMapping,
  SpreadsheetColumnMappingResult,
  SpreadsheetDetectedColumn
} from "@/types/spreadsheet";

const fieldAliases: Record<NormalizedRecruitingField, string[]> = {
  candidateName: ["name", "candidate", "candidateName", "姓名", "候选人", "候选人姓名"],
  position: ["position", "job", "jobTitle", "role", "岗位", "职位", "招聘岗位", "目标岗位"],
  source: ["source", "channel", "platform", "来源", "渠道", "招聘渠道", "简历来源"],
  status: ["status", "stage", "pipelineStatus", "状态", "阶段", "流程阶段", "面试状态"],
  interviewDate: ["interviewDate", "interviewTime", "面试日期", "面试时间"],
  result: ["result", "outcome", "finalStatus", "结果", "面试结果", "最终结果"]
};

const normalizedAliasToField = createAliasLookup(fieldAliases);

export function mapSpreadsheetColumns(headers: string[]): SpreadsheetColumnMappingResult {
  const usedFields = new Set<NormalizedRecruitingField>();
  const detectedColumns: SpreadsheetDetectedColumn[] = [];
  const mappings: SpreadsheetColumnMapping[] = [];

  headers.forEach((header) => {
    const mappedField = findMappedField(header);

    detectedColumns.push({
      header,
      mappedField
    });

    if (mappedField && !usedFields.has(mappedField)) {
      mappings.push({
        field: mappedField,
        header
      });
      usedFields.add(mappedField);
    }
  });

  return {
    detectedColumns,
    mappings
  };
}

export function findMappedField(header: string): NormalizedRecruitingField | null {
  return normalizedAliasToField.get(normalizeColumnName(header)) ?? null;
}

function createAliasLookup(
  aliases: Record<NormalizedRecruitingField, string[]>
): Map<string, NormalizedRecruitingField> {
  const lookup = new Map<string, NormalizedRecruitingField>();

  Object.entries(aliases).forEach(([field, fieldAliasList]) => {
    fieldAliasList.forEach((alias) => {
      lookup.set(normalizeColumnName(alias), field as NormalizedRecruitingField);
    });
  });

  return lookup;
}

function normalizeColumnName(value: string): string {
  return value.trim().replace(/[\s_-]+/g, "").toLowerCase();
}

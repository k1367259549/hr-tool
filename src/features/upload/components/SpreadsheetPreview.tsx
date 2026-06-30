"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { NormalizedRecruitingField, SpreadsheetAnalysisPreview } from "@/types/spreadsheet";

type SpreadsheetPreviewProps = {
  preview: SpreadsheetAnalysisPreview | null;
};

export function SpreadsheetPreview({ preview }: SpreadsheetPreviewProps): JSX.Element {
  return (
    <SectionCard title="表格预览" description="展示解析后的前 20 行数据。">
      {!preview || preview.rows.length === 0 ? (
        <EmptyState title="暂无表格预览" description="上传并分析文件后会显示解析结果。" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <PreviewMetric label="解析行数" value={String(preview.rowCount)} />
            <PreviewMetric label="检测列数" value={String(preview.headers.length)} />
            <PreviewMetric label="已映射字段" value={String(preview.columnMappings.length)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-950">字段映射</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.detectedColumns.map((column) => (
                  <span
                    key={column.header}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {column.header}
                    <span className="mx-1 text-slate-400">→</span>
                    <span className="font-medium text-slate-950">
                      {column.mappedField ? formatFieldLabel(column.mappedField) : "未映射"}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-950">缺失字段提醒</h3>
              {preview.missingFieldWarnings.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-amber-700">
                  {preview.missingFieldWarnings.map((warning) => (
                    <li key={warning}>{formatMissingFieldWarning(warning)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">标准字段没有明显缺失。</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <KpiCountList title="岗位分布" counts={preview.kpis.positionCounts} />
            <KpiCountList title="状态分布" counts={preview.kpis.statusCounts} />
            <KpiCountList title="来源分布" counts={preview.kpis.sourceCounts} />
            <KpiCountList title="结果分布" counts={preview.kpis.resultCounts} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950">样本数据</h3>
            <p className="mt-1 text-sm text-slate-500">展示解析后的前 20 行原始数据。</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  {preview.headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {preview.rows.map((row, index) => (
                  <tr key={`${index}-${JSON.stringify(row)}`}>
                    {preview.headers.map((header) => (
                      <td key={`${index}-${header}`} className="px-3 py-3 text-slate-700">
                        {formatCellValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function KpiCountList({
  title,
  counts
}: {
  title: string;
  counts: Record<string, number>;
}): JSX.Element {
  const entries = Object.entries(counts).slice(0, 6);

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {entries.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entries.map(([name, count]) => (
            <div key={name} className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-slate-600">{name}</span>
              <span className="font-medium text-slate-950">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">暂无可统计数据。</p>
      )}
    </div>
  );
}

function formatFieldLabel(field: NormalizedRecruitingField): string {
  const labels: Record<NormalizedRecruitingField, string> = {
    candidateName: "候选人",
    position: "岗位",
    source: "来源",
    status: "状态",
    interviewDate: "面试时间",
    result: "结果"
  };

  return labels[field];
}

function formatMissingFieldWarning(warning: string): string {
  const [field, countText] = warning.split(": ");
  const normalizedField = field as NormalizedRecruitingField;

  return `${formatFieldLabel(normalizedField)}：${countText}`;
}

function formatCellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return String(value);
}

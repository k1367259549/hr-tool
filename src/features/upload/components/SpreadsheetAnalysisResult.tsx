"use client";

import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { KpiCard } from "@/components/shared/KpiCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApiResponse } from "@/types/api";
import type { SpreadsheetAnalysisExportResponse } from "@/types/export";
import type { SpreadsheetAnalysisReport } from "@/types/spreadsheet";

type SpreadsheetAnalysisResultProps = {
  report: SpreadsheetAnalysisReport | null;
};

export function SpreadsheetAnalysisResult({
  report
}: SpreadsheetAnalysisResultProps): JSX.Element {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { showToast } = useToast();

  if (!report) {
    return (
      <EmptyState
        title="暂无分析报告"
        description="上传表格并完成 AI 分析后，报告会显示在这里。"
      />
    );
  }

  async function handleExport(): Promise<void> {
    if (!report) {
      showToast("暂无可导出的表格分析报告。", "error");
      return;
    }

    setIsExporting(true);

    try {
      const exportedReport = await requestSpreadsheetExport(report.upload.id);
      await navigator.clipboard.writeText(exportedReport.markdown);
      showToast("表格分析 Markdown 已复制到剪贴板。", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导出失败。", "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          disabled={isExporting}
          onClick={() => void handleExport()}
        >
          {isExporting ? "正在导出" : "导出 Markdown"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="文件名" value={report.upload.fileName} />
        <KpiCard title="文件类型" value={report.upload.fileType.toUpperCase()} />
        <KpiCard title="数据行数" value={String(report.upload.rowCount ?? 0)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalysisSection title="总结" content={report.analysis.summary} />
        <AnalysisSection title="洞察" content={report.analysis.insights} />
        <AnalysisSection title="问题" content={report.analysis.problems} />
        <AnalysisSection title="建议" content={report.analysis.suggestions} />
      </div>
    </div>
  );
}

type AnalysisSectionProps = {
  title: string;
  content: string;
};

function AnalysisSection({ title, content }: AnalysisSectionProps): JSX.Element {
  return (
    <SectionCard title={title}>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{content}</p>
    </SectionCard>
  );
}

async function requestSpreadsheetExport(
  uploadId: string
): Promise<SpreadsheetAnalysisExportResponse> {
  const response = await fetch(`/api/export/spreadsheet/${encodeURIComponent(uploadId)}`);
  const payload = (await response.json()) as ApiResponse<SpreadsheetAnalysisExportResponse>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

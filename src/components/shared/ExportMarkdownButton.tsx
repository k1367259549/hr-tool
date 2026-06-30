"use client";

import { useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApiResponse } from "@/types/api";
import type { DailyExportResponse } from "@/types/export";

type ExportMarkdownButtonProps = {
  date: string;
  label?: string;
};

export function ExportMarkdownButton({
  date,
  label = "导出 Markdown"
}: ExportMarkdownButtonProps): JSX.Element {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { showToast } = useToast();

  async function handleExport(): Promise<void> {
    if (!date) {
      showToast("请先选择日期再导出。", "error");
      return;
    }

    setIsExporting(true);

    try {
      const exportedReport = await requestExport(date);
      await navigator.clipboard.writeText(exportedReport.markdown);
      showToast("Markdown 已复制到剪贴板。", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导出失败。", "error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        disabled={isExporting}
        onClick={() => void handleExport()}
      >
        {isExporting ? "正在导出" : label}
      </button>
    </div>
  );
}

async function requestExport(date: string): Promise<DailyExportResponse> {
  const response = await fetch(`/api/export/daily?date=${encodeURIComponent(date)}`);
  const payload = (await response.json()) as ApiResponse<DailyExportResponse>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { DailyExportResponse } from "@/types/export";

type ExportMarkdownButtonProps = {
  date: string;
  label?: string;
};

export function ExportMarkdownButton({
  date,
  label = "Export Markdown"
}: ExportMarkdownButtonProps): JSX.Element {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  async function handleExport(): Promise<void> {
    if (!date) {
      showMessage("Select a date before exporting.", "error");
      return;
    }

    setIsExporting(true);

    try {
      const exportedReport = await requestExport(date);
      await navigator.clipboard.writeText(exportedReport.markdown);
      showMessage("Markdown copied to clipboard.", "success");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  function showMessage(nextMessage: string, nextTone: "success" | "error"): void {
    setTone(nextTone);
    setMessage(nextMessage);
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        disabled={isExporting}
        onClick={() => void handleExport()}
      >
        {isExporting ? "Exporting" : label}
      </button>
      {message ? <ExportToast message={message} tone={tone} /> : null}
    </div>
  );
}

type ExportToastProps = {
  message: string;
  tone: "success" | "error";
};

function ExportToast({ message, tone }: ExportToastProps): JSX.Element {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`fixed right-6 top-6 z-50 rounded-md border px-4 py-3 text-sm font-medium shadow-sm ${toneClass}`}>
      {message}
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

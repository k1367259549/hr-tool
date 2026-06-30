"use client";

import type { ChangeEvent } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageActions } from "@/components/shared/PageActions";
import { SectionCard } from "@/components/shared/SectionCard";

type SpreadsheetUploadFormProps = {
  selectedFile: File | null;
  isUploading: boolean;
  errorMessage: string | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => Promise<void>;
  onReset: () => void;
};

export function SpreadsheetUploadForm({
  selectedFile,
  isUploading,
  errorMessage,
  onFileChange,
  onUpload,
  onReset
}: SpreadsheetUploadFormProps): JSX.Element {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <SectionCard
      title="表格上传"
      description="上传 .xlsx 或 .csv 文件，后端会解析数据并生成 AI 招聘分析报告。"
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUploading}
            onClick={onReset}
          >
            清空
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUploading || !selectedFile}
            onClick={() => void onUpload()}
          >
            {isUploading ? "分析中..." : "上传并分析"}
          </button>
        </PageActions>
      }
    >
      <div className="space-y-5">
        {errorMessage ? <ErrorState title="无法分析表格" message={errorMessage} /> : null}
        <label
          htmlFor="spreadsheet-file"
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-white"
        >
          <span className="text-base font-semibold text-slate-950">
            {selectedFile ? selectedFile.name : "选择 Excel 或 CSV 文件"}
          </span>
          <span className="mt-2 text-sm leading-6 text-slate-500">
            支持 .xlsx 和 .csv，文件大小不超过 10MB。
          </span>
          <input
            id="spreadsheet-file"
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      </div>
    </SectionCard>
  );
}


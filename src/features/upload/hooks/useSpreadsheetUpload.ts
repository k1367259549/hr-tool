"use client";

import { useCallback, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { SpreadsheetAnalysisReport } from "@/types/spreadsheet";

type UseSpreadsheetUploadResult = {
  selectedFile: File | null;
  report: SpreadsheetAnalysisReport | null;
  isUploading: boolean;
  errorMessage: string | null;
  selectFile: (file: File | null) => void;
  uploadFile: () => Promise<void>;
  reset: () => void;
};

export function useSpreadsheetUpload(): UseSpreadsheetUploadResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [report, setReport] = useState<SpreadsheetAnalysisReport | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectFile = useCallback((file: File | null): void => {
    setSelectedFile(file);
    setReport(null);
    setErrorMessage(null);
  }, []);

  const reset = useCallback((): void => {
    setSelectedFile(null);
    setReport(null);
    setErrorMessage(null);
  }, []);

  const uploadFile = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("请先选择文件。");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const nextReport = await requestUpload(formData);

      setReport(nextReport);
    } catch (error) {
      setReport(null);
      setErrorMessage(error instanceof Error ? error.message : "上传分析失败。");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  return {
    selectedFile,
    report,
    isUploading,
    errorMessage,
    selectFile,
    uploadFile,
    reset
  };
}

async function requestUpload(formData: FormData): Promise<SpreadsheetAnalysisReport> {
  const response = await fetch("/api/upload/spreadsheet", {
    method: "POST",
    body: formData
  });
  const payload = (await response.json()) as ApiResponse<SpreadsheetAnalysisReport>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}


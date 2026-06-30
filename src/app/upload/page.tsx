"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { SpreadsheetAnalysisResult } from "@/features/upload/components/SpreadsheetAnalysisResult";
import { SpreadsheetPreview } from "@/features/upload/components/SpreadsheetPreview";
import { SpreadsheetUploadForm } from "@/features/upload/components/SpreadsheetUploadForm";
import { useSpreadsheetUpload } from "@/features/upload/hooks/useSpreadsheetUpload";

export default function UploadPage(): JSX.Element {
  const upload = useSpreadsheetUpload();

  return (
    <div className="space-y-8">
      <PageHeader
        title="表格分析"
        description="上传 Excel 或 CSV 招聘数据，生成 AI HR 分析报告。"
      />
      <SpreadsheetUploadForm
        selectedFile={upload.selectedFile}
        isUploading={upload.isUploading}
        errorMessage={upload.errorMessage}
        onFileChange={upload.selectFile}
        onUpload={upload.uploadFile}
        onReset={upload.reset}
      />
      {upload.isUploading ? (
        <LoadingState title="正在分析表格" description="后端正在解析文件并调用 AI 生成报告。" />
      ) : null}
      <SpreadsheetPreview preview={upload.report?.preview ?? null} />
      <SpreadsheetAnalysisResult report={upload.report} />
    </div>
  );
}


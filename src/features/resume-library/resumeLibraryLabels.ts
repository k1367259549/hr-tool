import type { ResumeIntakeSource } from "@prisma/client";

export const resumeIntakeSourceLabels: Record<ResumeIntakeSource, string> = {
  CANDIDATE_UNDERSTANDING: "Candidate Understanding",
  RESUME_LIBRARY: "Resume Library"
};

export const resumeParsingStatusLabels: Record<string, string> = {
  FAILED: "解析失败",
  PARSED: "已解析"
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export const resumeIntakeSourceLabels: Record<string, string> = {
  api: "API",
  CANDIDATE_UNDERSTANDING: "Candidate Understanding",
  feishu: "Feishu",
  manual: "Manual",
  upload: "Upload",
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

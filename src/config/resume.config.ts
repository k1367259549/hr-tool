export const SUPPORTED_RESUME_FILE_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const RESUME_FILE_SIZE_LIMIT_LABEL = "10MB";

export function getResumeFileExtension(fileName: string): string {
  const normalizedFileName = fileName.toLowerCase();
  const dotIndex = normalizedFileName.lastIndexOf(".");

  return dotIndex >= 0 ? normalizedFileName.slice(dotIndex) : "";
}

export function isSupportedResumeFileName(fileName: string): boolean {
  return SUPPORTED_RESUME_FILE_EXTENSIONS.includes(
    getResumeFileExtension(fileName) as (typeof SUPPORTED_RESUME_FILE_EXTENSIONS)[number]
  );
}

export function getNormalizedResumeFileType(fileName: string): "PDF" | "DOCX" | "TXT" | null {
  const extension = getResumeFileExtension(fileName);

  if (extension === ".pdf") {
    return "PDF";
  }

  if (extension === ".docx") {
    return "DOCX";
  }

  if (extension === ".txt") {
    return "TXT";
  }

  return null;
}

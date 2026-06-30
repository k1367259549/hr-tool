import type { SpreadsheetFileType } from "@/types/spreadsheet";

export const maxSpreadsheetFileSizeBytes = 10 * 1024 * 1024;

export type SpreadsheetValidationErrorCode =
  | "FILE_REQUIRED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE";

export class SpreadsheetValidationError extends Error {
  readonly code: SpreadsheetValidationErrorCode;

  constructor(code: SpreadsheetValidationErrorCode, message: string) {
    super(message);
    this.name = "SpreadsheetValidationError";
    this.code = code;
  }
}

const supportedExtensions: SpreadsheetFileType[] = ["xlsx", "csv"];

export function validateSpreadsheetFile(file: File | null): SpreadsheetFileType {
  if (!file) {
    throw new SpreadsheetValidationError("FILE_REQUIRED", "请上传文件。");
  }

  if (file.size > maxSpreadsheetFileSizeBytes) {
    throw new SpreadsheetValidationError("FILE_TOO_LARGE", "文件大小不能超过 10MB。");
  }

  const extension = getSpreadsheetFileExtension(file.name);

  if (!extension || !supportedExtensions.includes(extension)) {
    throw new SpreadsheetValidationError(
      "UNSUPPORTED_FILE_TYPE",
      "仅支持 .xlsx 或 .csv 文件。"
    );
  }

  return extension;
}

export function getSpreadsheetFileExtension(fileName: string): SpreadsheetFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "csv") {
    return extension;
  }

  return null;
}


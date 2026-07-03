import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  getResumeFileExtension,
  getNormalizedResumeFileType,
  isSupportedResumeFileName,
  MAX_RESUME_FILE_SIZE_BYTES,
  RESUME_FILE_SIZE_LIMIT_LABEL
} from "@/config/resume.config";

export class ResumeParserError extends Error {
  readonly code:
    | "FILE_REQUIRED"
    | "FILE_TOO_LARGE"
    | "UNSUPPORTED_FILE_TYPE"
    | "RESUME_PARSE_ERROR";

  constructor(
    code: "FILE_REQUIRED" | "FILE_TOO_LARGE" | "UNSUPPORTED_FILE_TYPE" | "RESUME_PARSE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ResumeParserError";
    this.code = code;
  }
}

export type ParsedResumeFile = {
  fileName: string;
  fileType: string;
  fileSize: number;
  originalFile: Uint8Array<ArrayBuffer>;
  parsedText: string;
};

export async function parseResumeFile(file: File | null): Promise<ParsedResumeFile> {
  if (!file) {
    throw new ResumeParserError("FILE_REQUIRED", "请上传简历文件。");
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new ResumeParserError("FILE_TOO_LARGE", `简历文件不能超过 ${RESUME_FILE_SIZE_LIMIT_LABEL}。`);
  }

  const fileName = file.name;
  const extension = getResumeFileExtension(fileName);
  const fileType = getNormalizedResumeFileType(fileName);

  if (!isSupportedResumeFileName(fileName) || !fileType) {
    throw new ResumeParserError("UNSUPPORTED_FILE_TYPE", "仅支持 PDF、DOCX、TXT 简历。");
  }

  const arrayBuffer = await file.arrayBuffer();
  const originalFile = new Uint8Array(arrayBuffer);
  const parsedText = normalizeParsedText(await safelyParseBuffer(Buffer.from(arrayBuffer), extension));

  if (parsedText.length === 0) {
    throw new ResumeParserError("RESUME_PARSE_ERROR", "未能从简历中解析出文本。");
  }

  return {
    fileName,
    fileSize: file.size,
    fileType,
    originalFile,
    parsedText
  };
}

async function safelyParseBuffer(buffer: Buffer, extension: string): Promise<string> {
  try {
    return await parseBufferByExtension(buffer, extension);
  } catch (error) {
    if (error instanceof ResumeParserError) {
      throw error;
    }

    throw new ResumeParserError("RESUME_PARSE_ERROR", "未能从简历中解析出文本。");
  }
}

async function parseBufferByExtension(buffer: Buffer, extension: string): Promise<string> {
  if (extension === ".txt") {
    return buffer.toString("utf8");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer });

    return result.value;
  }

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();

      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new ResumeParserError("UNSUPPORTED_FILE_TYPE", "仅支持 PDF、DOCX、TXT 简历。");
}

function normalizeParsedText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

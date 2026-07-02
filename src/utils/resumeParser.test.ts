import { describe, expect, it, vi } from "vitest";
import { MAX_RESUME_FILE_SIZE_BYTES } from "@/config/resume.config";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn()
  }
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class PDFParse {
    async getText(): Promise<{ text: string }> {
      return { text: "" };
    }

    async destroy(): Promise<void> {
      return undefined;
    }
  }
}));

describe("parseResumeFile", () => {
  it("rejects files over the centralized resume size limit", async () => {
    const file = new TestFile("resume.txt", "text/plain", MAX_RESUME_FILE_SIZE_BYTES + 1);

    await expect(parseResumeFile(file as unknown as File)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE"
    } satisfies Partial<ResumeParserError>);
  });

  it("rejects unsupported resume file types", async () => {
    const file = new TestFile("resume.zip", "application/zip", 10);

    await expect(parseResumeFile(file as unknown as File)).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE"
    } satisfies Partial<ResumeParserError>);
  });
});

class TestFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;

  constructor(name: string, type: string, size: number) {
    this.name = name;
    this.size = size;
    this.type = type;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new Uint8Array(this.size).buffer;
  }
}

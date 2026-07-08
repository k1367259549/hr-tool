import { describe, expect, it, vi } from "vitest";
import {
  isSupportedResumeFileName,
  MAX_RESUME_FILE_SIZE_BYTES
} from "@/config/resume.config";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(async () => ({ value: "Parsed DOCX resume" }))
  }
}));

describe("parseResumeFile", () => {
  it("allows TXT files exactly at the centralized resume size limit", async () => {
    const file = new TestFile("resume.txt", "text/plain", MAX_RESUME_FILE_SIZE_BYTES);

    await expect(parseResumeFile(file as unknown as File)).resolves.toMatchObject({
      fileName: "resume.txt",
      fileSize: MAX_RESUME_FILE_SIZE_BYTES,
      fileType: "TXT"
    });
  });

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

  it("extracts text from a real text-based PDF", async () => {
    const file = new TestFile(
      "resume.pdf",
      "application/pdf",
      createTextPdf("Candidate Resume PDF Text")
    );

    await expect(parseResumeFile(file as unknown as File)).resolves.toMatchObject({
      fileName: "resume.pdf",
      fileType: "PDF",
      parsedText: expect.stringContaining("Candidate Resume PDF Text")
    });
  });

  it("recognizes supported lowercase resume extensions", () => {
    expect(isSupportedResumeFileName("resume.pdf")).toBe(true);
    expect(isSupportedResumeFileName("resume.docx")).toBe(true);
    expect(isSupportedResumeFileName("resume.txt")).toBe(true);
  });

  it("recognizes supported uppercase resume extensions", () => {
    expect(isSupportedResumeFileName("resume.PDF")).toBe(true);
    expect(isSupportedResumeFileName("resume.DOCX")).toBe(true);
    expect(isSupportedResumeFileName("resume.TXT")).toBe(true);
  });

  it("recognizes unsupported resume extensions", () => {
    expect(isSupportedResumeFileName("resume.zip")).toBe(false);
    expect(isSupportedResumeFileName("resume")).toBe(false);
  });
});

class TestFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  private readonly content: Uint8Array<ArrayBuffer>;

  constructor(name: string, type: string, content: number | Uint8Array<ArrayBuffer>) {
    this.name = name;
    this.type = type;
    this.content = typeof content === "number" ? new Uint8Array(content) : content;
    this.size = this.content.byteLength;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.content.buffer.slice(
      this.content.byteOffset,
      this.content.byteOffset + this.content.byteLength
    );
  }
}

function createTextPdf(text: string): Uint8Array<ArrayBuffer> {
  const content = `BT /F1 18 Tf 100 700 Td (${escapePdfText(text)}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf) as Uint8Array<ArrayBuffer>;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

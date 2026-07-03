import { describe, expect, it } from "vitest";
import {
  parseResumeListQuery,
  parseResumeMetadataUpdatePayload,
  parseResumeUploadFormData,
  ResumeLibraryValidationError,
  validateResumeFile
} from "@/utils/resumeLibraryValidation";

describe("resumeLibraryValidation", () => {
  it.each([
    ["resume.pdf", "PDF"],
    ["resume.DOCX", "DOCX"],
    ["resume.txt", "TXT"]
  ])("accepts supported resume file %s", (fileName, expectedFileType) => {
    const file = new File(["hello"], fileName);

    expect(validateResumeFile(file)).toBe(expectedFileType);
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(() => validateResumeFile(new File(["hello"], "resume.exe"))).toThrow(
      ResumeLibraryValidationError
    );
    expect(() => validateResumeFile(new File([], "resume.txt"))).toThrow(
      ResumeLibraryValidationError
    );
    expect(() => validateResumeFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "resume.pdf"))).toThrow(
      ResumeLibraryValidationError
    );
  });

  it("allows exactly 10MB", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024)], "resume.pdf");

    expect(validateResumeFile(file)).toBe("PDF");
  });

  it("rejects missing file and unknown multipart fields", () => {
    const missingFileForm = new FormData();
    missingFileForm.set("candidateSource", "内推");

    expect(() => parseResumeUploadFormData(missingFileForm)).toThrow(ResumeLibraryValidationError);

    const unknownFieldForm = new FormData();
    unknownFieldForm.set("file", new File(["hello"], "resume.txt"));
    unknownFieldForm.set("jobProfileId", "job-id");

    expect(() => parseResumeUploadFormData(unknownFieldForm)).toThrow(
      "不支持的字段：jobProfileId。"
    );
  });

  it("parses list filters and pagination", () => {
    const query = parseResumeListQuery(
      new URLSearchParams(
        "search= resume &fileType=PDF&parsingStatus=PARSED&intakeSource=RESUME_LIBRARY&linkStatus=unlinked&page=2&pageSize=10"
      )
    );

    expect(query).toEqual({
      fileType: "PDF",
      intakeSource: "RESUME_LIBRARY",
      linkStatus: "unlinked",
      page: 2,
      pageSize: 10,
      parsingStatus: "PARSED",
      search: "resume"
    });
  });

  it("rejects invalid list filters and empty patch", () => {
    expect(() => parseResumeListQuery(new URLSearchParams("page=0"))).toThrow(
      ResumeLibraryValidationError
    );
    expect(() => parseResumeListQuery(new URLSearchParams("fileType=PNG"))).toThrow(
      ResumeLibraryValidationError
    );
    expect(() => parseResumeMetadataUpdatePayload({})).toThrow(ResumeLibraryValidationError);
  });

  it("allows only source and notes metadata updates", () => {
    expect(parseResumeMetadataUpdatePayload({ candidateSource: "内推", notes: "" })).toEqual({
      candidateSource: "内推",
      notes: null
    });
    expect(() => parseResumeMetadataUpdatePayload({ candidateId: "candidate-id" })).toThrow(
      "不支持的字段：candidateId。"
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import {
  resumeLibraryService,
  ResumeLibraryServiceError
} from "@/services/resumeLibrary.service";
import { generateResumeContentHash } from "@/utils/resumeContentHash";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";
import { ResumeLibraryValidationError } from "@/utils/resumeLibraryValidation";

vi.mock("@/repositories/candidateResume.repository", () => ({
  candidateResumeRepository: {
    countOtherResumesByHash: vi.fn(),
    createResume: vi.fn(),
    findResumeDetailById: vi.fn(),
    findResumeList: vi.fn(),
    listPossibleDuplicates: vi.fn(),
    updateResumeMetadata: vi.fn()
  }
}));

vi.mock("@/utils/resumeParser", () => ({
  ResumeParserError: class ResumeParserError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "ResumeParserError";
      this.code = code;
    }
  },
  parseResumeFile: vi.fn()
}));

describe("resumeLibraryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(candidateResumeRepository.countOtherResumesByHash).mockResolvedValue(0);
    vi.mocked(candidateResumeRepository.listPossibleDuplicates).mockResolvedValue([]);
  });

  it("uploads an independent Resume Library record without candidate or job profile", async () => {
    const file = new File(["hello resume"], "resume.txt");
    vi.mocked(parseResumeFile).mockResolvedValueOnce({
      fileName: "resume.txt",
      fileSize: file.size,
      fileType: "TXT",
      originalFile: new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>,
      parsedText: "hello resume"
    });
    vi.mocked(candidateResumeRepository.createResume).mockResolvedValueOnce(createCreatedResume());
    vi.mocked(candidateResumeRepository.findResumeDetailById).mockResolvedValueOnce(
      createDetailRecord({
        contentHash: "hash-value"
      }) as never
    );

    const result = await resumeLibraryService.uploadResume({
      candidateSource: "内推",
      file,
      notes: "人工备注"
    });

    expect(result.resume.id).toBe("resume-id");
    expect(candidateResumeRepository.createResume).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: null,
        candidateSource: "内推",
        contentHash: generateResumeContentHash("hello resume"),
        intakeSource: "upload",
        jobProfileId: null,
        language: null,
        parserVersion: "v1",
        parsingStatus: "PARSED"
      })
    );
  });

  it("stores supported parse failures as FAILED records", async () => {
    const file = new File(["not really a pdf"], "resume.pdf");
    vi.mocked(parseResumeFile).mockRejectedValueOnce(
      new ResumeParserError("RESUME_PARSE_ERROR", "未能从简历中解析出文本。")
    );
    vi.mocked(candidateResumeRepository.createResume).mockResolvedValueOnce(createCreatedResume());
    vi.mocked(candidateResumeRepository.findResumeDetailById).mockResolvedValueOnce(
      createDetailRecord({
        parsedText: null,
        parsingError: "未能从简历中解析出文本。",
        parsingStatus: "FAILED"
      }) as never
    );

    const result = await resumeLibraryService.uploadResume({
      file
    });

    expect(result.resume.parsingStatus).toBe("FAILED");
    expect(candidateResumeRepository.createResume).toHaveBeenCalledWith(
      expect.objectContaining({
        contentHash: null,
        parsedText: null,
        parsingError: "未能从简历中解析出文本。",
        parsingStatus: "FAILED"
      })
    );
  });

  it("rejects unsupported files before persistence", async () => {
    await expect(
      resumeLibraryService.uploadResume({
        file: new File(["hello"], "resume.exe")
      })
    ).rejects.toBeInstanceOf(ResumeLibraryValidationError);

    expect(candidateResumeRepository.createResume).not.toHaveBeenCalled();
  });

  it("returns duplicate signal without blocking upload", async () => {
    const file = new File(["hello resume"], "resume.txt");
    vi.mocked(parseResumeFile).mockResolvedValueOnce({
      fileName: "resume.txt",
      fileSize: file.size,
      fileType: "TXT",
      originalFile: new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>,
      parsedText: "hello resume"
    });
    vi.mocked(candidateResumeRepository.createResume).mockResolvedValueOnce(createCreatedResume());
    vi.mocked(candidateResumeRepository.countOtherResumesByHash).mockResolvedValue(2);
    vi.mocked(candidateResumeRepository.findResumeDetailById).mockResolvedValueOnce(
      createDetailRecord({
        contentHash: "hash-value"
      }) as never
    );

    const result = await resumeLibraryService.uploadResume({
      file
    });

    expect(result.duplicateSignal).toEqual({
      duplicateCount: 2,
      hasDuplicates: true
    });
  });

  it("skips database update for no-op metadata patch", async () => {
    vi.mocked(candidateResumeRepository.findResumeDetailById).mockResolvedValueOnce(
      createDetailRecord({
        candidateSource: "内推",
        notes: "备注"
      }) as never
    );

    await resumeLibraryService.updateResumeMetadata("resume-id", {
      candidateSource: "内推",
      notes: "备注"
    });

    expect(candidateResumeRepository.updateResumeMetadata).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for missing resume detail", async () => {
    vi.mocked(candidateResumeRepository.findResumeDetailById).mockResolvedValueOnce(null);

    await expect(resumeLibraryService.getResume("missing-id")).rejects.toMatchObject({
      code: "NOT_FOUND"
    } satisfies Partial<ResumeLibraryServiceError>);
  });
});

function createCreatedResume() {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    candidateId: null,
    candidateSource: null,
    contentHash: "hash-value",
    createdAt: now,
    fileName: "resume.txt",
    fileSize: 12,
    fileType: "TXT",
    id: "resume-id",
    intakeSource: "upload",
    jobProfileId: null,
    language: null,
    notes: null,
    originalFile: new Uint8Array([1]) as Uint8Array<ArrayBuffer>,
    parserVersion: "v1",
    parsedText: "hello resume",
    parsingError: null,
    parsingStatus: "PARSED",
    resumeVersion: "resume-parser-v1",
    semanticChunks: [],
    structureChunks: [],
    updatedAt: now,
    workflowId: "workflow-id"
  };
}

function createDetailRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    candidate: null,
    candidateId: null,
    candidateSource: null,
    contentHash: "hash-value",
    createdAt: now,
    fileName: "resume.txt",
    fileSize: 12,
    fileType: "TXT",
    id: "resume-id",
    intakeSource: "upload",
    jobProfile: null,
    jobProfileId: null,
    language: null,
    notes: null,
    parserVersion: "v1",
    parsedText: "hello resume",
    parsingError: null,
    parsingStatus: "PARSED",
    semanticChunks: [],
    structureChunks: [
      {
        chunkId: "chunk-1"
      }
    ],
    updatedAt: now,
    ...overrides
  };
}

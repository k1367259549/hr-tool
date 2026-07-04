import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";

const runIntegration =
  process.env.RUN_PRISMA_INTEGRATION_TESTS === "true" &&
  isAllowedLocalDatabaseUrl(process.env.DATABASE_URL);

const maybeDescribe = runIntegration ? describe : describe.skip;
const prisma = new PrismaClient();

maybeDescribe("Resume Library PostgreSQL integration", () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const resumeLibraryId = `it-library-resume-${suffix}`;
  const candidateUnderstandingResumeId = `it-cu-resume-${suffix}`;
  const duplicateResumeAId = `it-duplicate-a-${suffix}`;
  const duplicateResumeBId = `it-duplicate-b-${suffix}`;
  const jobProfileId = `it-resume-library-job-${suffix}`;
  const contentHash = `hash-${suffix}`;
  const duplicateHash = `duplicate-hash-${suffix}`;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.jobProfile.create({
      data: {
        aiModel: "integration-test-model",
        aiProvider: "integration-test-provider",
        coreResponsibilities: [],
        hiringFocus: [],
        id: jobProfileId,
        interviewFocus: [],
        jd: "Synthetic JD for Resume Library integration test.",
        jobSummary: "Synthetic job.",
        jobTitle: "Synthetic Resume Library Role",
        missingInformation: [],
        potentialRisks: [],
        preferredCompetencies: [],
        promptFile: "integration-test.md",
        promptVersion: "test",
        requiredCompetencies: [],
        reviewedAt: new Date(),
        suggestedFollowUpQuestions: [],
        workflowId: `it-resume-library-workflow-${suffix}`
      }
    });
  });

  afterAll(async () => {
    await prisma.candidateResume.deleteMany({
      where: {
        id: {
          in: [
            resumeLibraryId,
            candidateUnderstandingResumeId,
            duplicateResumeAId,
            duplicateResumeBId
          ]
        }
      }
    });
    await prisma.jobProfile.deleteMany({
      where: {
        id: jobProfileId
      }
    });
    await prisma.$disconnect();
  });

  it("creates an independent Resume Library resume", async () => {
    await prisma.candidateResume.create({
      data: {
        candidateId: null,
        contentHash,
        fileName: "library-resume.txt",
        fileSize: 32,
        fileType: "TXT",
        id: resumeLibraryId,
        intakeSource: "upload",
        jobProfileId: null,
        language: null,
        originalFile: Buffer.from("synthetic resume"),
        parsedText: "Synthetic parsed resume.",
        parserVersion: "v1",
        parsingStatus: "PARSED",
        resumeVersion: "integration-test",
        semanticChunks: [],
        structureChunks: [],
        workflowId: `it-library-upload-${suffix}`
      }
    });

    const resume = await prisma.candidateResume.findUniqueOrThrow({
      select: {
        candidateId: true,
        intakeSource: true,
        jobProfileId: true
      },
      where: {
        id: resumeLibraryId
      }
    });

    expect(resume).toEqual({
      candidateId: null,
      intakeSource: "upload",
      jobProfileId: null
    });
  });

  it("keeps Candidate Understanding compatible with a reviewed Job Profile context", async () => {
    await prisma.candidateResume.create({
      data: {
        candidateId: null,
        contentHash: `${contentHash}-candidate-understanding`,
        fileName: "candidate-understanding-resume.txt",
        fileSize: 32,
        fileType: "TXT",
        id: candidateUnderstandingResumeId,
        intakeSource: "CANDIDATE_UNDERSTANDING",
        jobProfileId,
        language: null,
        originalFile: Buffer.from("synthetic resume"),
        parsedText: "Synthetic parsed resume.",
        parserVersion: "v1",
        parsingStatus: "PARSED",
        resumeVersion: "integration-test",
        semanticChunks: [],
        structureChunks: [],
        workflowId: `it-cu-upload-${suffix}`
      }
    });

    const resume = await prisma.candidateResume.findUniqueOrThrow({
      select: {
        intakeSource: true,
        jobProfileId: true
      },
      where: {
        id: candidateUnderstandingResumeId
      }
    });

    expect(resume.jobProfileId).toBe(jobProfileId);
    expect(resume.intakeSource).toBe("CANDIDATE_UNDERSTANDING");
  });

  it("allows duplicate hashes without unique conflicts or automatic linking", async () => {
    await prisma.candidateResume.createMany({
      data: [
        createDuplicateResumeData(duplicateResumeAId, duplicateHash, suffix),
        createDuplicateResumeData(duplicateResumeBId, duplicateHash, suffix)
      ]
    });

    const duplicateCount = await candidateResumeRepository.countOtherResumesByHash(
      duplicateHash,
      duplicateResumeAId
    );
    const duplicates = await candidateResumeRepository.listPossibleDuplicates(
      duplicateHash,
      duplicateResumeAId,
      5
    );
    const resumeCount = await prisma.candidateResume.count({
      where: {
        contentHash: duplicateHash
      }
    });
    const linkedCount = await prisma.candidateResume.count({
      where: {
        candidateId: {
          not: null
        },
        contentHash: duplicateHash
      }
    });

    expect(resumeCount).toBe(2);
    expect(duplicateCount).toBe(1);
    expect(duplicates).toHaveLength(1);
    expect(linkedCount).toBe(0);
  });
});

function createDuplicateResumeData(id: string, contentHash: string, suffix: string) {
  return {
    contentHash,
    fileName: `${id}.txt`,
    fileSize: 32,
    fileType: "TXT",
    id,
    intakeSource: "upload",
    language: null,
    originalFile: Buffer.from("same synthetic resume"),
    parsedText: "Same synthetic parsed resume.",
    parserVersion: "v1",
    parsingStatus: "PARSED",
    resumeVersion: "integration-test",
    semanticChunks: [],
    structureChunks: [],
    workflowId: `it-duplicate-upload-${suffix}-${id}`
  };
}

function isAllowedLocalDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) {
    return false;
  }

  try {
    const url = new URL(databaseUrl);
    const isLocalHost = ["localhost", "127.0.0.1", "db"].includes(url.hostname);
    const databaseName = url.pathname.replace("/", "");

    return isLocalHost && ["hr_daily", "hr_daily_test"].includes(databaseName);
  } catch {
    return false;
  }
}

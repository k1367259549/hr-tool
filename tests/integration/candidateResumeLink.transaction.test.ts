import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import {
  candidateResumeLinkService,
  CandidateResumeLinkServiceError
} from "@/services/candidateResumeLink.service";

const runIntegration =
  process.env.RUN_PRISMA_INTEGRATION_TESTS === "true" &&
  isAllowedLocalDatabaseUrl(process.env.DATABASE_URL);

const maybeDescribe = runIntegration ? describe : describe.skip;
const prisma = new PrismaClient();

maybeDescribe("CandidateResume link transaction integration", () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const candidateId = `it-candidate-${suffix}`;
  const candidateAId = `it-candidate-a-${suffix}`;
  const candidateBId = `it-candidate-b-${suffix}`;
  const jobProfileId = `it-job-${suffix}`;
  const resumeId = `it-resume-${suffix}`;
  const concurrentResumeId = `it-concurrent-resume-${suffix}`;
  const staleUnlinkResumeId = `it-stale-unlink-resume-${suffix}`;

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
        jd: "Synthetic JD for transaction rollback test.",
        jobSummary: "Synthetic job.",
        jobTitle: "Synthetic Role",
        missingInformation: [],
        potentialRisks: [],
        preferredCompetencies: [],
        promptFile: "integration-test.md",
        promptVersion: "test",
        requiredCompetencies: [],
        suggestedFollowUpQuestions: [],
        workflowId: `it-workflow-${suffix}`
      }
    });
    await prisma.candidate.createMany({
      data: [
        {
          fullName: "Synthetic Candidate",
          id: candidateId,
          targetRoles: [],
          tags: []
        },
        {
          fullName: "Synthetic Candidate A",
          id: candidateAId,
          targetRoles: [],
          tags: []
        },
        {
          fullName: "Synthetic Candidate B",
          id: candidateBId,
          targetRoles: [],
          tags: []
        }
      ]
    });
    await prisma.candidateResume.create({
      data: {
        fileName: "synthetic-resume.pdf",
        fileSize: 128,
        fileType: "PDF",
        id: resumeId,
        jobProfileId,
        originalFile: Buffer.from("synthetic resume"),
        parsedText: "Synthetic parsed resume text.",
        parsingStatus: "PARSED",
        resumeVersion: "integration-test",
        semanticChunks: [],
        structureChunks: [],
        workflowId: `it-resume-workflow-${suffix}`
      }
    });
    await prisma.candidateResume.createMany({
      data: [
        createResumeData({
          id: concurrentResumeId,
          jobProfileId,
          workflowId: `it-concurrent-resume-workflow-${suffix}`
        }),
        createResumeData({
          candidateId: candidateBId,
          id: staleUnlinkResumeId,
          jobProfileId,
          workflowId: `it-stale-unlink-resume-workflow-${suffix}`
        })
      ]
    });
  });

  afterAll(async () => {
    await prisma.candidateAudit.deleteMany({
      where: {
        candidateId: {
          in: [candidateId, candidateAId, candidateBId]
        }
      }
    });
    await prisma.candidateResume.deleteMany({
      where: {
        id: {
          in: [resumeId, concurrentResumeId, staleUnlinkResumeId]
        }
      }
    });
    await prisma.candidate.deleteMany({
      where: {
        id: {
          in: [candidateId, candidateAId, candidateBId]
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

  it("rolls back resume link when audit creation fails", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.candidateResume.update({
          data: {
            candidateId
          },
          where: {
            id: resumeId
          }
        });
        await tx.candidateAudit.create({
          data: {
            action: "RESUME_LINKED",
            actor: "RECRUITER",
            afterValue: {
              fileType: "PDF",
              originalName: "synthetic-resume.pdf",
              resumeId
            },
            candidateId: "missing-candidate-for-rollback"
          }
        });
      })
    ).rejects.toThrow();

    const resume = await prisma.candidateResume.findUniqueOrThrow({
      select: {
        candidateId: true
      },
      where: {
        id: resumeId
      }
    });
    const auditCount = await prisma.candidateAudit.count({
      where: {
        candidateId,
        action: "RESUME_LINKED"
      }
    });

    expect(resume.candidateId).toBeNull();
    expect(auditCount).toBe(0);
  });

  it("allows only one concurrent link for the same resume", async () => {
    const results = await Promise.allSettled([
      candidateResumeLinkService.linkResume(candidateAId, {
        resumeId: concurrentResumeId
      }),
      candidateResumeLinkService.linkResume(candidateBId, {
        resumeId: concurrentResumeId
      })
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({
        code: "CONFLICT"
      }) satisfies Partial<CandidateResumeLinkServiceError>
    });

    const resume = await prisma.candidateResume.findUniqueOrThrow({
      select: {
        candidateId: true
      },
      where: {
        id: concurrentResumeId
      }
    });
    const audits = await prisma.candidateAudit.findMany({
      select: {
        action: true,
        candidateId: true
      },
      where: {
        action: "RESUME_LINKED",
        candidateId: {
          in: [candidateAId, candidateBId]
        }
      }
    });

    expect([candidateAId, candidateBId]).toContain(resume.candidateId);
    expect(audits).toHaveLength(1);
    expect(audits[0]?.candidateId).toBe(resume.candidateId);
  });

  it("does not clear a resume when stale unlink candidate no longer owns it", async () => {
    const count = await candidateResumeRepository.unlinkResumeFromCandidate(
      staleUnlinkResumeId,
      candidateAId
    );
    const resume = await prisma.candidateResume.findUniqueOrThrow({
      select: {
        candidateId: true
      },
      where: {
        id: staleUnlinkResumeId
      }
    });

    expect(count).toBe(0);
    expect(resume.candidateId).toBe(candidateBId);
  });
});

function createResumeData(input: {
  candidateId?: string;
  id: string;
  jobProfileId: string;
  workflowId: string;
}) {
  return {
    candidateId: input.candidateId,
    fileName: `${input.id}.pdf`,
    fileSize: 128,
    fileType: "PDF",
    id: input.id,
    jobProfileId: input.jobProfileId,
    originalFile: Buffer.from("synthetic resume"),
    parsedText: "Synthetic parsed resume text.",
    parsingStatus: "PARSED",
    resumeVersion: "integration-test",
    semanticChunks: [],
    structureChunks: [],
    workflowId: input.workflowId
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

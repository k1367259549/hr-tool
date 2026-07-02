import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  candidateApplicationService,
  CandidateApplicationServiceError
} from "@/services/candidateApplication.service";

const runIntegration =
  process.env.RUN_PRISMA_INTEGRATION_TESTS === "true" &&
  isAllowedLocalDatabaseUrl(process.env.DATABASE_URL);

const maybeDescribe = runIntegration ? describe : describe.skip;
const prisma = new PrismaClient();

maybeDescribe("CandidateApplication transaction integration", () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const candidateId = `it-app-candidate-${suffix}`;
  const jobProfileId = `it-app-job-${suffix}`;
  const transitionCandidateId = `it-transition-candidate-${suffix}`;
  const transitionJobProfileId = `it-transition-job-${suffix}`;
  const rollbackCandidateId = `it-rollback-candidate-${suffix}`;
  const rollbackJobProfileId = `it-rollback-job-${suffix}`;
  const applicationIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.candidate.createMany({
      data: [
        {
          fullName: "Synthetic Application Candidate",
          id: candidateId,
          tags: [],
          targetRoles: []
        },
        {
          fullName: "Synthetic Transition Candidate",
          id: transitionCandidateId,
          tags: [],
          targetRoles: []
        },
        {
          fullName: "Synthetic Rollback Candidate",
          id: rollbackCandidateId,
          tags: [],
          targetRoles: []
        }
      ]
    });
    await prisma.jobProfile.createMany({
      data: [
        createJobProfileData(jobProfileId, suffix),
        createJobProfileData(transitionJobProfileId, `${suffix}-transition`),
        createJobProfileData(rollbackJobProfileId, `${suffix}-rollback`)
      ]
    });
  });

  afterAll(async () => {
    await prisma.applicationEvent.deleteMany({
      where: {
        applicationId: {
          in: applicationIds
        }
      }
    });
    await prisma.candidateApplication.deleteMany({
      where: {
        OR: [
          {
            id: {
              in: applicationIds
            }
          },
          {
            candidateId: {
              in: [candidateId, transitionCandidateId, rollbackCandidateId]
            }
          }
        ]
      }
    });
    await prisma.candidate.deleteMany({
      where: {
        id: {
          in: [candidateId, transitionCandidateId, rollbackCandidateId]
        }
      }
    });
    await prisma.jobProfile.deleteMany({
      where: {
        id: {
          in: [jobProfileId, transitionJobProfileId, rollbackJobProfileId]
        }
      }
    });
    await prisma.$disconnect();
  });

  it("allows only one active application per candidate and job under concurrent create", async () => {
    const results = await Promise.allSettled([
      candidateApplicationService.createApplication({
        candidateId,
        jobProfileId,
        owner: "owner-a"
      }),
      candidateApplicationService.createApplication({
        candidateId,
        jobProfileId,
        owner: "owner-b"
      })
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    fulfilled.forEach((result) => {
      if (result.status === "fulfilled") {
        applicationIds.push(result.value.id);
      }
    });

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({
        code: "CONFLICT"
      }) satisfies Partial<CandidateApplicationServiceError>
    });

    const activeCount = await prisma.candidateApplication.count({
      where: {
        candidateId,
        closedAt: null,
        jobProfileId
      }
    });
    const eventCount = await prisma.applicationEvent.count({
      where: {
        application: {
          candidateId,
          jobProfileId
        },
        eventType: "CREATED"
      }
    });

    expect(activeCount).toBe(1);
    expect(eventCount).toBe(1);
  });

  it("allows only one concurrent transition and writes one matching event", async () => {
    const application = await candidateApplicationService.createApplication({
      candidateId: transitionCandidateId,
      jobProfileId: transitionJobProfileId
    });
    applicationIds.push(application.id);
    await candidateApplicationService.transitionApplicationStage(application.id, {
      toStage: "RESUME_SCREEN"
    });

    const results = await Promise.allSettled([
      candidateApplicationService.transitionApplicationStage(application.id, {
        toStage: "PHONE_SCREEN"
      }),
      candidateApplicationService.transitionApplicationStage(application.id, {
        toStage: "REJECTED"
      })
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({
        code: "CONFLICT"
      }) satisfies Partial<CandidateApplicationServiceError>
    });

    const refreshedApplication = await prisma.candidateApplication.findUniqueOrThrow({
      select: {
        currentStage: true
      },
      where: {
        id: application.id
      }
    });
    const events = await prisma.applicationEvent.findMany({
      select: {
        fromStage: true,
        toStage: true
      },
      where: {
        applicationId: application.id,
        fromStage: "RESUME_SCREEN"
      }
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.toStage).toBe(refreshedApplication.currentStage);
  });

  it("rolls back application create when event creation fails", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const application = await tx.candidateApplication.create({
          data: {
            candidateId: rollbackCandidateId,
            jobProfileId: rollbackJobProfileId
          }
        });
        await tx.applicationEvent.create({
          data: {
            applicationId: `${application.id}-missing`,
            eventType: "CREATED"
          }
        });
      })
    ).rejects.toThrow();

    const applicationCount = await prisma.candidateApplication.count({
      where: {
        candidateId: rollbackCandidateId,
        jobProfileId: rollbackJobProfileId
      }
    });

    expect(applicationCount).toBe(0);
  });
});

function createJobProfileData(id: string, suffix: string) {
  return {
    aiModel: "integration-test-model",
    aiProvider: "integration-test-provider",
    coreResponsibilities: [],
    hiringFocus: [],
    id,
    interviewFocus: [],
    jd: "Synthetic JD for CandidateApplication integration test.",
    jobSummary: "Synthetic job.",
    jobTitle: `Synthetic Pipeline Role ${suffix}`,
    missingInformation: [],
    potentialRisks: [],
    preferredCompetencies: [],
    promptFile: "integration-test.md",
    promptVersion: "test",
    requiredCompetencies: [],
    reviewedAt: new Date(),
    suggestedFollowUpQuestions: [],
    workflowId: `it-app-workflow-${suffix}`
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

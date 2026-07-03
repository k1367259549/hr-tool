import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  evaluationTemplateService,
  EvaluationTemplateServiceError
} from "@/services/evaluationTemplate.service";

const runIntegration =
  process.env.RUN_PRISMA_INTEGRATION_TESTS === "true" &&
  isAllowedLocalDatabaseUrl(process.env.DATABASE_URL);

const maybeDescribe = runIntegration ? describe : describe.skip;
const prisma = new PrismaClient();

maybeDescribe("EvaluationTemplate transaction integration", () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const jobProfileId = `it-eval-job-${suffix}`;
  const replaceJobProfileId = `it-eval-replace-job-${suffix}`;
  const templateIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.jobProfile.createMany({
      data: [
        createJobProfileData(jobProfileId, suffix),
        createJobProfileData(replaceJobProfileId, `${suffix}-replace`)
      ]
    });
  });

  afterAll(async () => {
    await prisma.jobProfileEvaluationAssignment.deleteMany({
      where: {
        OR: [
          {
            jobProfileId: {
              in: [jobProfileId, replaceJobProfileId]
            }
          },
          {
            templateVersion: {
              templateId: {
                in: templateIds
              }
            }
          }
        ]
      }
    });
    await prisma.evaluationTemplateVersion.deleteMany({
      where: {
        templateId: {
          in: templateIds
        }
      }
    });
    await prisma.evaluationTemplate.deleteMany({
      where: {
        id: {
          in: templateIds
        }
      }
    });
    await prisma.jobProfile.deleteMany({
      where: {
        id: {
          in: [jobProfileId, replaceJobProfileId]
        }
      }
    });
    await prisma.$disconnect();
  });

  it("creates Template and Version 1 atomically", async () => {
    const template = await evaluationTemplateService.createTemplate({
      name: `Synthetic Evaluation Template ${suffix}`
    });
    templateIds.push(template.id);

    const stored = await prisma.evaluationTemplate.findUniqueOrThrow({
      include: {
        versions: true
      },
      where: {
        id: template.id
      }
    });

    expect(stored.latestVersionNumber).toBe(1);
    expect(stored.versions).toHaveLength(1);
    expect(stored.versions[0]?.status).toBe("DRAFT");
  });

  it("allows only one concurrent next Draft", async () => {
    const template = await evaluationTemplateService.createTemplate({
      name: `Synthetic Draft Race Template ${suffix}`
    });
    templateIds.push(template.id);
    await evaluationTemplateService.publishVersion(template.currentDraftVersion?.id ?? "");

    const results = await Promise.allSettled([
      evaluationTemplateService.createNextDraft(template.id),
      evaluationTemplateService.createNextDraft(template.id)
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      reason: expect.objectContaining({
        code: "CONFLICT"
      }) satisfies Partial<EvaluationTemplateServiceError>
    });

    const drafts = await prisma.evaluationTemplateVersion.findMany({
      where: {
        status: "DRAFT",
        templateId: template.id
      }
    });
    const versionNumbers = await prisma.evaluationTemplateVersion.findMany({
      select: {
        versionNumber: true
      },
      where: {
        templateId: template.id
      }
    });

    expect(drafts).toHaveLength(1);
    expect(new Set(versionNumbers.map((version) => version.versionNumber)).size).toBe(
      versionNumbers.length
    );
  });

  it("keeps Published Version immutable through conditional update", async () => {
    const template = await evaluationTemplateService.createTemplate({
      name: `Synthetic Immutable Template ${suffix}`
    });
    templateIds.push(template.id);
    const draftId = template.currentDraftVersion?.id ?? "";
    await evaluationTemplateService.updateDraftVersion(draftId, {
      criteria: [
        {
          description: "Original description.",
          importance: "REQUIRED",
          key: "original-key",
          label: "Original"
        }
      ]
    });
    await evaluationTemplateService.publishVersion(draftId);

    await expect(
      evaluationTemplateService.updateDraftVersion(draftId, {
        criteria: [
          {
            description: "Mutated description.",
            importance: "REQUIRED",
            key: "mutated-key",
            label: "Mutated"
          }
        ]
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<EvaluationTemplateServiceError>);

    const stored = await prisma.evaluationTemplateVersion.findUniqueOrThrow({
      where: {
        id: draftId
      }
    });

    expect(stored.criteria).toEqual([
      {
        description: "Original description.",
        importance: "REQUIRED",
        key: "original-key",
        label: "Original"
      }
    ]);
  });

  it("allows only one active assignment under concurrent requests", async () => {
    const firstTemplate = await createPublishedTemplate(`Synthetic Assign A ${suffix}`);
    const secondTemplate = await createPublishedTemplate(`Synthetic Assign B ${suffix}`);
    templateIds.push(firstTemplate.id, secondTemplate.id);

    const results = await Promise.allSettled([
      evaluationTemplateService.assignTemplateVersion(jobProfileId, {
        assignedBy: "owner-a",
        templateVersionId: firstTemplate.versionId
      }),
      evaluationTemplateService.assignTemplateVersion(jobProfileId, {
        assignedBy: "owner-b",
        templateVersionId: secondTemplate.versionId
      })
    ]);

    const activeAssignments = await prisma.jobProfileEvaluationAssignment.findMany({
      where: {
        endedAt: null,
        jobProfileId
      }
    });

    expect(results.filter((result) => result.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
    expect(activeAssignments).toHaveLength(1);
  });

  it("replacement closes old assignment and keeps history", async () => {
    const firstTemplate = await createPublishedTemplate(`Synthetic Replace A ${suffix}`);
    const secondTemplate = await createPublishedTemplate(`Synthetic Replace B ${suffix}`);
    templateIds.push(firstTemplate.id, secondTemplate.id);

    await evaluationTemplateService.assignTemplateVersion(replaceJobProfileId, {
      templateVersionId: firstTemplate.versionId
    });
    await evaluationTemplateService.assignTemplateVersion(replaceJobProfileId, {
      templateVersionId: secondTemplate.versionId
    });

    const assignments = await prisma.jobProfileEvaluationAssignment.findMany({
      orderBy: {
        assignedAt: "asc"
      },
      where: {
        jobProfileId: replaceJobProfileId
      }
    });

    expect(assignments).toHaveLength(2);
    expect(assignments.filter((assignment) => assignment.endedAt === null)).toHaveLength(1);
    expect(assignments.filter((assignment) => assignment.endedAt !== null)).toHaveLength(1);
  });
});

async function createPublishedTemplate(name: string): Promise<{ id: string; versionId: string }> {
  const template = await evaluationTemplateService.createTemplate({
    name
  });
  const versionId = template.currentDraftVersion?.id ?? "";
  await evaluationTemplateService.publishVersion(versionId);

  return {
    id: template.id,
    versionId
  };
}

function createJobProfileData(id: string, suffix: string) {
  return {
    aiModel: "integration-test-model",
    aiProvider: "integration-test-provider",
    coreResponsibilities: [],
    hiringFocus: [],
    id,
    interviewFocus: [],
    jd: "Synthetic JD for EvaluationTemplate integration test.",
    jobSummary: "Synthetic job.",
    jobTitle: `Synthetic Evaluation Role ${suffix}`,
    missingInformation: [],
    potentialRisks: [],
    preferredCompetencies: [],
    promptFile: "integration-test.md",
    promptVersion: "test",
    requiredCompetencies: [],
    reviewedAt: new Date(),
    suggestedFollowUpQuestions: [],
    workflowId: `it-eval-template-workflow-${suffix}`
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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
import { jobProfileEvaluationAssignmentRepository } from "@/repositories/jobProfileEvaluationAssignment.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import {
  evaluationTemplateService,
  EvaluationTemplateServiceError
} from "@/services/evaluationTemplate.service";
import type {
  EvaluationTemplateDetailRecord,
  EvaluationTemplateVersionRecord,
  JobProfileEvaluationAssignmentRecord
} from "@/types/evaluationTemplate";
import type { JobProfile } from "@/types/jobProfile";

const transactionClient = {
  tx: "evaluation-template-transaction-client"
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) => callback(transactionClient))
  }
}));

vi.mock("@/repositories/evaluationTemplate.repository", () => ({
  evaluationTemplateRepository: {
    archiveTemplate: vi.fn(),
    createNextDraftVersion: vi.fn(),
    createTemplateWithInitialDraft: vi.fn(),
    findActiveDraft: vi.fn(),
    findLatestPublishedVersion: vi.fn(),
    findTemplateDetailById: vi.fn(),
    findVersionById: vi.fn(),
    incrementLatestVersionNumber: vi.fn(),
    listTemplates: vi.fn(),
    publishDraftVersion: vi.fn(),
    restoreTemplate: vi.fn(),
    updateDraftVersion: vi.fn(),
    updateTemplateMetadata: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfileEvaluationAssignment.repository", () => ({
  jobProfileEvaluationAssignmentRepository: {
    countActiveAssignmentsForTemplate: vi.fn(),
    endActiveAssignment: vi.fn(),
    findActiveAssignment: vi.fn(),
    listAssignmentHistory: vi.fn(),
    replaceActiveAssignment: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
  }
}));

describe("evaluationTemplateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate).mockResolvedValue(0);
    vi.mocked(jobProfileEvaluationAssignmentRepository.listAssignmentHistory).mockResolvedValue([]);
  });

  it("creates template and Version 1 Draft in one transaction", async () => {
    vi.mocked(evaluationTemplateRepository.createTemplateWithInitialDraft).mockResolvedValueOnce(
      createTemplate()
    );

    const result = await evaluationTemplateService.createTemplate({
      description: "说明",
      name: "Backend Evaluation"
    });

    expect(result.latestVersionNumber).toBe(1);
    expect(result.currentDraftVersion?.versionNumber).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(evaluationTemplateRepository.createTemplateWithInitialDraft).toHaveBeenCalledWith(
      {
        description: "说明",
        name: "Backend Evaluation"
      },
      transactionClient
    );
  });

  it("updates Draft but rejects Published or archived template edits", async () => {
    const draft = createVersion();
    vi.mocked(evaluationTemplateRepository.findVersionById)
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce({
        ...draft,
        criteria: [
          {
            description: "new",
            importance: "REQUIRED",
            key: "new-key",
            label: "New"
          }
        ]
      });
    vi.mocked(evaluationTemplateRepository.updateDraftVersion).mockResolvedValueOnce(1);

    const result = await evaluationTemplateService.updateDraftVersion("version-id", {
      criteria: [
        {
          description: "new",
          importance: "REQUIRED",
          key: "new-key",
          label: "New"
        }
      ]
    });

    expect(result.criteria[0]?.key).toBe("new-key");
    expect(evaluationTemplateRepository.updateDraftVersion).toHaveBeenCalledWith(
      "version-id",
      expect.objectContaining({
        criteria: expect.any(Array)
      }),
      transactionClient
    );

    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      createVersion({ status: "PUBLISHED" })
    );
    await expect(evaluationTemplateService.updateDraftVersion("version-id", { criteria: [] })).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<EvaluationTemplateServiceError>);

    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      createVersion({
        template: createTemplate({
          status: "ARCHIVED"
        })
      })
    );
    await expect(evaluationTemplateService.updateDraftVersion("version-id", { criteria: [] })).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<EvaluationTemplateServiceError>);
  });

  it("skips no-op Draft update and publishes with conditional update", async () => {
    const draft = createVersion();
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(draft);

    await evaluationTemplateService.updateDraftVersion("version-id", {
      criteria: []
    });

    expect(evaluationTemplateRepository.updateDraftVersion).not.toHaveBeenCalled();

    vi.mocked(evaluationTemplateRepository.findVersionById)
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(
        createVersion({
          publishedAt: new Date("2026-01-02T00:00:00.000Z"),
          status: "PUBLISHED"
        })
      );
    vi.mocked(evaluationTemplateRepository.publishDraftVersion).mockResolvedValueOnce(1);

    const published = await evaluationTemplateService.publishVersion("version-id");

    expect(published.status).toBe("PUBLISHED");
    expect(evaluationTemplateRepository.publishDraftVersion).toHaveBeenCalledWith(
      "version-id",
      expect.any(Date),
      transactionClient
    );
  });

  it("creates next Draft by copying latest Published and rejects existing Draft", async () => {
    const template = createTemplate({
      versions: []
    });
    const published = createVersion({
      criteria: [
        {
          description: "desc",
          importance: "REQUIRED",
          key: "service-layer",
          label: "Service Layer"
        }
      ],
      instructions: "Use evidence.",
      status: "PUBLISHED",
      versionNumber: 1
    });
    vi.mocked(evaluationTemplateRepository.findTemplateDetailById).mockResolvedValueOnce(template);
    vi.mocked(evaluationTemplateRepository.findActiveDraft).mockResolvedValueOnce(null);
    vi.mocked(evaluationTemplateRepository.incrementLatestVersionNumber).mockResolvedValueOnce({
      latestVersionNumber: 2
    });
    vi.mocked(evaluationTemplateRepository.findLatestPublishedVersion).mockResolvedValueOnce(published);
    vi.mocked(evaluationTemplateRepository.createNextDraftVersion).mockResolvedValueOnce(
      createVersion({
        criteria: published.criteria,
        instructions: "Use evidence.",
        versionNumber: 2
      })
    );

    const draft = await evaluationTemplateService.createNextDraft("template-id");

    expect(draft.versionNumber).toBe(2);
    expect(draft.criteria[0]?.key).toBe("service-layer");

    vi.mocked(evaluationTemplateRepository.findTemplateDetailById).mockResolvedValueOnce(createTemplate());
    vi.mocked(evaluationTemplateRepository.findActiveDraft).mockResolvedValueOnce(createVersion());

    await expect(evaluationTemplateService.createNextDraft("template-id")).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<EvaluationTemplateServiceError>);
  });

  it("archives only without active assignments and restores manually", async () => {
    vi.mocked(evaluationTemplateRepository.findTemplateDetailById).mockResolvedValueOnce(createTemplate());
    vi.mocked(jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate).mockResolvedValueOnce(1);

    await expect(evaluationTemplateService.archiveTemplate("template-id")).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<EvaluationTemplateServiceError>);

    vi.mocked(evaluationTemplateRepository.findTemplateDetailById).mockResolvedValueOnce(createTemplate());
    vi.mocked(jobProfileEvaluationAssignmentRepository.countActiveAssignmentsForTemplate).mockResolvedValueOnce(0);
    vi.mocked(evaluationTemplateRepository.archiveTemplate).mockResolvedValueOnce(
      createTemplate({
        archivedAt: new Date("2026-01-02T00:00:00.000Z"),
        status: "ARCHIVED"
      })
    );

    const archived = await evaluationTemplateService.archiveTemplate("template-id");
    expect(archived.status).toBe("ARCHIVED");

    vi.mocked(evaluationTemplateRepository.findTemplateDetailById).mockResolvedValueOnce(
      createTemplate({ status: "ARCHIVED" })
    );
    vi.mocked(evaluationTemplateRepository.restoreTemplate).mockResolvedValueOnce(createTemplate());
    const restored = await evaluationTemplateService.restoreTemplate("template-id");
    expect(restored.status).toBe("ACTIVE");
  });

  it("requires reviewed Job Profile, Published Version, and Active Template for assignment", async () => {
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(createJobProfile({ reviewedAt: null }));
    await expect(
      evaluationTemplateService.assignTemplateVersion("job-id", {
        templateVersionId: "version-id"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<EvaluationTemplateServiceError>);

    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(createJobProfile());
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(createVersion());
    await expect(
      evaluationTemplateService.assignTemplateVersion("job-id", {
        templateVersionId: "version-id"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<EvaluationTemplateServiceError>);
  });

  it("supports same-version assignment no-op, replacement, and unassign no-op", async () => {
    const published = createVersion({ status: "PUBLISHED" });
    const current = createAssignment({
      templateVersion: published,
      templateVersionId: published.id
    });

    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(createJobProfile());
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(published);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(current);
    vi.mocked(jobProfileEvaluationAssignmentRepository.listAssignmentHistory).mockResolvedValueOnce([current]);

    const noOp = await evaluationTemplateService.assignTemplateVersion("job-id", {
      templateVersionId: published.id
    });

    expect(noOp.activeAssignment?.templateVersionId).toBe(published.id);
    expect(jobProfileEvaluationAssignmentRepository.replaceActiveAssignment).not.toHaveBeenCalled();

    const nextVersion = createVersion({ id: "version-2", status: "PUBLISHED", versionNumber: 2 });
    const nextAssignment = createAssignment({
      id: "assignment-2",
      templateVersion: nextVersion,
      templateVersionId: nextVersion.id
    });
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(createJobProfile());
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(nextVersion);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment)
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(nextAssignment);
    vi.mocked(jobProfileEvaluationAssignmentRepository.replaceActiveAssignment).mockResolvedValueOnce(nextAssignment);
    vi.mocked(jobProfileEvaluationAssignmentRepository.listAssignmentHistory).mockResolvedValueOnce([
      nextAssignment,
      current
    ]);

    const replaced = await evaluationTemplateService.assignTemplateVersion("job-id", {
      assignedBy: "recruiter",
      templateVersionId: nextVersion.id
    });
    expect(replaced.activeAssignment?.templateVersionId).toBe(nextVersion.id);

    vi.mocked(jobProfileEvaluationAssignmentRepository.endActiveAssignment).mockResolvedValueOnce(0);
    vi.mocked(jobProfileEvaluationAssignmentRepository.listAssignmentHistory).mockResolvedValueOnce([]);
    const unassigned = await evaluationTemplateService.unassignTemplateVersion("job-id");
    expect(unassigned.activeAssignment).toBeNull();
  });
});

function createTemplate(overrides: Partial<EvaluationTemplateDetailRecord> = {}): EvaluationTemplateDetailRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const base = {
    archivedAt: null,
    createdAt: now,
    description: "说明",
    id: "template-id",
    latestVersionNumber: 1,
    name: "Backend Evaluation",
    status: "ACTIVE" as const,
    updatedAt: now,
    versions: [] as EvaluationTemplateDetailRecord["versions"]
  };

  const template = {
    ...base,
    ...overrides
  };

  if (!overrides.versions) {
    template.versions = [createVersion({ template })];
  }

  return template;
}

function createVersion(
  overrides: Partial<EvaluationTemplateVersionRecord> = {}
): EvaluationTemplateVersionRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const template = overrides.template ?? createTemplate({ versions: [] });

  return {
    changeNote: null,
    createdAt: now,
    createdBy: null,
    criteria: [],
    id: "version-id",
    instructions: null,
    publishedAt: null,
    status: "DRAFT",
    template,
    templateId: template.id,
    updatedAt: now,
    versionNumber: 1,
    ...overrides
  };
}

function createAssignment(
  overrides: Partial<JobProfileEvaluationAssignmentRecord> = {}
): JobProfileEvaluationAssignmentRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const templateVersion = overrides.templateVersion ?? createVersion({ status: "PUBLISHED" });

  return {
    assignedAt: now,
    assignedBy: "recruiter",
    endedAt: null,
    id: "assignment-id",
    jobProfileId: "job-id",
    templateVersion,
    templateVersionId: templateVersion.id,
    ...overrides
  };
}

function createJobProfile(overrides: Partial<JobProfile> = {}): JobProfile {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    aiModel: "test-model",
    aiProvider: "test-provider",
    coreResponsibilities: [],
    createdAt: now,
    generationTimeMs: null,
    hiringFocus: [],
    hiringGoal: "招 1 人",
    id: "job-id",
    interviewFocus: [],
    jd: "Synthetic JD.",
    jobSummary: "Synthetic role.",
    jobTitle: "Synthetic Role",
    leaderRequirements: null,
    missingInformation: [],
    notes: null,
    potentialRisks: [],
    preferredCompetencies: [],
    promptFile: "test.md",
    promptVersion: "test",
    requiredCompetencies: [],
    reviewedAt: now,
    suggestedFollowUpQuestions: [],
    teamBackground: null,
    updatedAt: now,
    workflowId: "workflow-id",
    ...overrides
  };
}

import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  DetailedScreeningResultSchema,
  DetailedScreeningResultV2Schema,
  DuplicateCheckResultSchema,
  FeishuScreeningSummarySchema,
  QuickScreeningResultSchema,
  ResumeScreeningProfileSchema,
  ScreeningDimensionResultSchema,
  ScreeningEvidenceSchema
} from "@/lib/resume-screening/schema";
import type {
  DetailedScreeningResult,
  DetailedScreeningResultV2,
  DuplicateCheckResult,
  FeishuScreeningSummary,
  QuickScreeningResult,
  ResumeScreeningProfile,
  ScreeningDimensionResult,
  ScreeningEvidence
} from "@/types/resume-screening";

describe("resume screening core schemas", () => {
  it("accepts complete valid core screening contracts", () => {
    expect(ResumeScreeningProfileSchema.safeParse(createValidProfile()).success).toBe(true);
    expect(QuickScreeningResultSchema.safeParse(createValidQuickResult()).success).toBe(true);
    expect(DetailedScreeningResultSchema.safeParse(createValidDetailedResult()).success).toBe(
      true
    );
    expect(DuplicateCheckResultSchema.safeParse(createValidDuplicateResult()).success).toBe(
      true
    );
    expect(FeishuScreeningSummarySchema.safeParse(createValidFeishuSummary()).success).toBe(
      true
    );
  });

  it("accepts a minimum valid quick screening result and applies array defaults", () => {
    const minimal = {
      dimensions: [createValidDimension()],
      educationPass: "unclear",
      evidence: [createValidEvidence()],
      fullTimeBachelor: "unclear",
      mainRisk: "Evidence is still limited.",
      nextStep: "Ask recruiter to manually review the resume.",
      notes: null,
      overallScore: 50,
      priority: "C",
      reasons: ["Resume has enough information for a quick manual review."],
      recommendation: "MANUAL_REVIEW",
      robotArmRelevance: "unclear",
      schemaVersion: "m11-a.quick.v1",
      screeningMode: "QUICK",
      shouldEnterDetailedAnalysis: "manual_review",
      summary: "Minimum quick screening result with traceable evidence."
    };

    const result = QuickScreeningResultSchema.safeParse(minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strengths).toEqual([]);
      expect(result.data.risks).toEqual([]);
      expect(result.data.missingInformation).toEqual([]);
      expect(result.data.interviewQuestions).toEqual([]);
    }
  });

  it("rejects invalid screening mode", () => {
    const result = QuickScreeningResultSchema.safeParse({
      ...createValidQuickResult(),
      screeningMode: "FAST"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid recommendation", () => {
    const result = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      recommendation: "AUTO_HIRE"
    });

    expect(result.success).toBe(false);
  });

  it("rejects overall scores below 0", () => {
    const result = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      overallScore: -1
    });

    expect(result.success).toBe(false);
  });

  it("rejects overall scores above 100", () => {
    const result = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      overallScore: 101
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer and non-finite score values", () => {
    const nonIntegerResult = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      overallScore: 82.5
    });
    const infiniteResult = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      dimensions: [
        {
          ...createValidDimension(),
          score: Number.POSITIVE_INFINITY
        }
      ]
    });
    const nanResult = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      overallScore: Number.NaN
    });

    expect(nonIntegerResult.success).toBe(false);
    expect(infiniteResult.success).toBe(false);
    expect(nanResult.success).toBe(false);
  });

  it("rejects empty required strings after trimming", () => {
    const result = DetailedScreeningResultSchema.safeParse({
      ...createValidDetailedResult(),
      summary: "   "
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid dimension structures without traceable evidence", () => {
    const result = ScreeningDimensionResultSchema.safeParse({
      ...createValidDimension(),
      evidence: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects undeclared core fields through strict schemas", () => {
    const result = QuickScreeningResultSchema.safeParse({
      ...createValidQuickResult(),
      rawProviderResponse: "not part of the core contract"
    });

    expect(result.success).toBe(false);
  });

  it("rejects evidence without an allowed source", () => {
    const result = ScreeningEvidenceSchema.safeParse({
      ...createValidEvidence(),
      source: "LINKEDIN_PROFILE"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a complete V2 detailed result with hyphenated criterion keys", () => {
    const result = DetailedScreeningResultV2Schema.safeParse(createValidDetailedV2Result());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contractVersion).toBe("detailed-screening.v2");
      expect(result.data.criterionAssessments.map((item) => item.criterionKey)).toEqual([
        "backend-api",
        "motion-control",
        "robotics-experience"
      ]);
    }
  });

  it("rejects V2 results with a wrong contract version or missing criterion assessments", () => {
    const wrongVersion = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      contractVersion: "detailed-screening.v1"
    });
    const missingAssessments = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      criterionAssessments: undefined
    });

    expect(wrongVersion.success).toBe(false);
    expect(missingAssessments.success).toBe(false);
  });

  it("keeps V2 risks and missing information independent", () => {
    const result = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      missingInformation: ["Weekly availability is not stated."],
      risks: []
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid V2 criterion assessment fields and unknown fields", () => {
    const blankConclusion = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      criterionAssessments: [
        {
          ...createValidDetailedV2Result().criterionAssessments[0],
          conclusion: " "
        }
      ]
    });
    const invalidEvidence = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      criterionAssessments: [
        {
          ...createValidDetailedV2Result().criterionAssessments[0],
          evidence: []
        }
      ]
    });
    const underscoreKey = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      criterionAssessments: [
        {
          ...createValidDetailedV2Result().criterionAssessments[0],
          criterionKey: "backend_api"
        }
      ]
    });
    const unknownField = DetailedScreeningResultV2Schema.safeParse({
      ...createValidDetailedV2Result(),
      rawProviderResponse: "not allowed"
    });

    expect(blankConclusion.success).toBe(false);
    expect(invalidEvidence.success).toBe(false);
    expect(underscoreKey.success).toBe(false);
    expect(unknownField.success).toBe(false);
  });

  it("keeps TypeScript types aligned with schema inference", () => {
    type QuickSchemaOutput = z.infer<typeof QuickScreeningResultSchema>;
    type DetailedSchemaOutput = z.infer<typeof DetailedScreeningResultSchema>;
    type DetailedV2SchemaOutput = z.infer<typeof DetailedScreeningResultV2Schema>;
    type EvidenceSchemaOutput = z.infer<typeof ScreeningEvidenceSchema>;

    expectTypeOf<QuickSchemaOutput>().toMatchTypeOf<QuickScreeningResult>();
    expectTypeOf<QuickScreeningResult>().toMatchTypeOf<QuickSchemaOutput>();
    expectTypeOf<DetailedSchemaOutput>().toMatchTypeOf<DetailedScreeningResult>();
    expectTypeOf<DetailedScreeningResult>().toMatchTypeOf<DetailedSchemaOutput>();
    expectTypeOf<DetailedV2SchemaOutput>().toMatchTypeOf<DetailedScreeningResultV2>();
    expectTypeOf<DetailedScreeningResultV2>().toMatchTypeOf<DetailedV2SchemaOutput>();
    expectTypeOf<EvidenceSchemaOutput>().toMatchTypeOf<ScreeningEvidence>();
    expectTypeOf<ScreeningEvidence>().toMatchTypeOf<EvidenceSchemaOutput>();
  });
});

function createValidProfile(
  overrides: Partial<ResumeScreeningProfile> = {}
): ResumeScreeningProfile {
  return {
    candidateName: "Candidate A",
    companyBackground: {
      currentCompany: "Robotics Vendor",
      industryRelevance: "high",
      notableCompanies: ["Robotics Vendor"],
      notes: "Has worked in automation-related business context."
    },
    coreCapabilities: [
      {
        evidence: "Resume mentions robot arm integration and field debugging.",
        level: "high",
        name: "Robot arm integration"
      }
    ],
    education: {
      educationPass: "yes",
      fullTimeBachelor: "yes",
      graduationYear: 2023,
      highestDegree: "Bachelor",
      major: "Automation",
      school: "Engineering University"
    },
    email: "candidate@example.com",
    experienceQuality: {
      ownershipSignals: ["Owned on-site debugging"],
      qualityNotes: "Project evidence is concrete enough for quick screening.",
      relevantProjects: ["Robot arm commissioning project"],
      yearsOfExperience: 2
    },
    jobMatch: {
      matchedKeywords: ["robot arm", "debugging"],
      missingKeywords: ["PLC"],
      robotArmRelevance: "high",
      targetRoleMatch: "medium"
    },
    jobSeekingStatus: {
      availability: "Within two weeks",
      currentStatus: "Open to opportunities",
      expectedLocation: "Shanghai",
      expectedRole: "Robot Arm Engineer"
    },
    outputSuggestion: {
      nextStep: "Enter detailed analysis and phone screen availability.",
      notes: null,
      recommendation: "PROCEED_TO_NEXT_STEP"
    },
    phone: "13800000000",
    resumeSource: "upload",
    risks: [
      {
        description: "PLC evidence is not explicit in the resume.",
        severity: "medium",
        title: "Missing PLC evidence"
      }
    ],
    schemaVersion: "m11-a.profile.v1",
    targetJobTitle: "Robot Arm Engineer",
    ...overrides
  };
}

function createValidQuickResult(
  overrides: Partial<QuickScreeningResult> = {}
): QuickScreeningResult {
  return {
    dimensions: [createValidDimension()],
    educationPass: "yes",
    evidence: [createValidEvidence()],
    fullTimeBachelor: "yes",
    interviewQuestions: [
      "Please describe the robot arm commissioning project listed in your resume."
    ],
    mainRisk: "PLC experience still needs confirmation.",
    missingInformation: ["Weekly internship availability is not shown."],
    nextStep: "Run detailed screening after recruiter confirmation.",
    notes: null,
    overallScore: 78,
    priority: "A",
    reasons: ["Education and robot arm relevance pass quick screening."],
    recommendation: "PROCEED_TO_NEXT_STEP",
    risks: [
      {
        description: "PLC ownership is unclear.",
        severity: "medium",
        title: "PLC evidence gap"
      }
    ],
    robotArmRelevance: "high",
    schemaVersion: "m11-a.quick.v1",
    screeningMode: "QUICK",
    shouldEnterDetailedAnalysis: "yes",
    strengths: ["Direct robot arm project evidence."],
    summary: "Candidate has enough initial relevance for detailed screening.",
    ...overrides
  };
}

function createValidDetailedResult(
  overrides: Partial<DetailedScreeningResult> = {}
): DetailedScreeningResult {
  return {
    dimensions: [
      createValidDimension(),
      createValidDimension({
        key: "education",
        matchLevel: "high",
        name: "Education",
        score: 85
      })
    ],
    evidence: [createValidEvidence()],
    interviewQuestions: [
      "Which robot arm brands and controllers have you used?",
      "What information is missing about your weekly availability?"
    ],
    missingInformation: ["Weekly availability is not explicit."],
    nextStep: "Phone screen project depth and availability.",
    notes: null,
    overallScore: 84,
    recommendation: "MANUAL_REVIEW",
    risks: [
      {
        description: "PLC ownership is unclear.",
        severity: "medium",
        title: "PLC evidence gap"
      }
    ],
    schemaVersion: "m11-a.detailed.v1",
    screeningMode: "DETAILED",
    strengths: ["Direct robot arm project evidence."],
    summary: "The candidate has relevant robot arm experience with some gaps.",
    weaknesses: ["PLC evidence is not explicit."],
    ...overrides
  };
}

function createValidDetailedV2Result(
  overrides: Partial<DetailedScreeningResultV2> = {}
): DetailedScreeningResultV2 {
  const evidence = createValidEvidence({ id: "ev_backend_api" });

  return {
    ...createValidDetailedResult(),
    contractVersion: "detailed-screening.v2",
    criterionAssessments: [
      "backend-api",
      "motion-control",
      "robotics-experience"
    ].map((criterionKey) => ({
      conclusion: `${criterionKey} is supported by the available resume evidence.`,
      criterionKey,
      criterionLabel: criterionKey,
      evidence: [evidence],
      interviewQuestions: [],
      missingInformation: [],
      risks: [],
      score: 80
    })),
    schemaVersion: "m11-a.detailed.v2",
    ...overrides
  };
}

function createValidDuplicateResult(
  overrides: Partial<DuplicateCheckResult> = {}
): DuplicateCheckResult {
  return {
    confidence: 92,
    matchedCandidateNames: ["Candidate A"],
    matchedResumeIds: ["resume_001"],
    reasons: ["Same phone number and similar resume hash."],
    schemaVersion: "m11-a.duplicate.v1",
    status: "possible_match",
    ...overrides
  };
}

function createValidFeishuSummary(
  overrides: Partial<FeishuScreeningSummary> = {}
): FeishuScreeningSummary {
  return {
    candidateName: "Candidate A",
    copyableText: "Candidate A | Robot Arm Engineer | Priority A",
    duplicateStatus: "possible_match",
    mainRisk: "PLC experience needs confirmation.",
    missingInformation: ["Weekly availability is not explicit."],
    nextStep: "Phone screen and confirm availability.",
    overallScore: 84,
    priority: "A",
    recommendation: "MANUAL_REVIEW",
    risks: ["PLC evidence gap."],
    schemaVersion: "m11-a.feishu-summary.v1",
    strengths: ["Robot arm project evidence."],
    targetJobTitle: "Robot Arm Engineer",
    ...overrides
  };
}

function createValidDimension(
  overrides: Partial<ScreeningDimensionResult> = {}
): ScreeningDimensionResult {
  return {
    conclusion: "Resume mentions robot arm commissioning related to the role.",
    evidence: [createValidEvidence()],
    key: "robot_arm_relevance",
    matchLevel: "high",
    missingInformation: ["Controller brand is not specified."],
    name: "Robot arm relevance",
    risks: ["PLC evidence is incomplete."],
    score: 88,
    ...overrides
  };
}

function createValidEvidence(
  overrides: Partial<ScreeningEvidence> = {}
): ScreeningEvidence {
  return {
    id: "resume_robot_arm_project",
    relatedRequirement: "Robot arm commissioning experience",
    source: "RESUME",
    text: "Resume mentions robot arm commissioning and field debugging.",
    ...overrides
  };
}

import type { Prisma } from "@prisma/client";
import type { JsonObject } from "@/types/ai";
import type { CandidateInsightDto } from "@/types/candidateUnderstanding";
import type { JobProfileDto } from "@/types/jobProfile";

export type PhoneScreenPreparationOutput = {
  conversationGoals: string[];
  suggestedOpening: string;
  keyVerificationQuestions: string[];
  riskVerificationQuestions: string[];
  informationToConfirm: string[];
  conversationChecklist: string[];
  thingsToAvoid: string[];
};

export type PhoneNotes = {
  keyFacts: string[];
  candidateMotivation: string;
  salaryExpectation: string;
  availability: string;
  communicationQuality: string;
  openQuestions: string[];
  freeNotes: string;
};

export type InterviewPreparationOutput = {
  interviewFocus: string[];
  suggestedQuestions: string[];
  evidenceToVerify: string[];
  missingInformation: string[];
  highPriorityTopics: string[];
  possibleFollowUpQuestions: string[];
};

export type InterviewNotes = {
  interviewSummary: string;
  strengths: string[];
  weaknesses: string[];
  newEvidence: string[];
  concerns: string[];
  overallImpression: string;
};

export type RecruiterSummaryOutput = {
  candidateTimeline: string[];
  confirmedFacts: string[];
  unconfirmedFacts: string[];
  recruiterNotesSummary: string;
  suggestedNextRecruiterActions: string[];
  openQuestions: string[];
};

export type RecruitTogetherGenerationResult<TOutput> = TOutput & {
  workflowId: string;
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs?: number;
  generatedAt: string;
};

export type PhonePreparationResult = RecruitTogetherGenerationResult<PhoneScreenPreparationOutput>;

export type InterviewPreparationResult =
  RecruitTogetherGenerationResult<InterviewPreparationOutput>;

export type RecruiterSummaryResult = RecruitTogetherGenerationResult<RecruiterSummaryOutput>;

export type RecruitTogetherContextInput = {
  workflowId?: string;
  jobProfileId: string;
  candidateInsightId: string;
};

export type InterviewPreparationInput = RecruitTogetherContextInput & {
  phonePreparation: PhoneScreenPreparationOutput;
  phoneNotes: PhoneNotes;
};

export type RecruiterSummaryInput = RecruitTogetherContextInput & {
  phonePreparation: PhoneScreenPreparationOutput;
  phoneNotes: PhoneNotes;
  interviewPreparation: InterviewPreparationOutput;
  interviewNotes: InterviewNotes;
};

export type RecruitTogetherCreateInput = RecruiterSummaryInput & {
  recruiterSummary: RecruiterSummaryOutput;
  aiProvider: string;
  aiModel: string;
  promptVersions: {
    phonePreparation: string;
    interviewPreparation: string;
    recruiterSummary: string;
  };
  generationTimes: {
    phonePreparation?: number;
    interviewPreparation?: number;
    recruiterSummary?: number;
  };
};

export type RecruitTogetherWorkflow = {
  id: string;
  workflowId: string;
  jobProfileId: string;
  candidateInsightId: string;
  phonePreparation: Prisma.JsonValue;
  phoneNotes: Prisma.JsonValue;
  interviewPreparation: Prisma.JsonValue;
  interviewNotes: Prisma.JsonValue;
  recruiterSummary: Prisma.JsonValue;
  aiProvider: string;
  aiModel: string;
  promptVersions: Prisma.JsonValue;
  generationTimes: Prisma.JsonValue;
  humanReview: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruitTogetherWorkflowDto = Omit<
  RecruitTogetherWorkflow,
  | "phonePreparation"
  | "phoneNotes"
  | "interviewPreparation"
  | "interviewNotes"
  | "recruiterSummary"
  | "promptVersions"
  | "generationTimes"
  | "humanReview"
  | "createdAt"
  | "updatedAt"
> & {
  phonePreparation: PhoneScreenPreparationOutput;
  phoneNotes: PhoneNotes;
  interviewPreparation: InterviewPreparationOutput;
  interviewNotes: InterviewNotes;
  recruiterSummary: RecruiterSummaryOutput;
  promptVersions: RecruitTogetherCreateInput["promptVersions"];
  generationTimes: RecruitTogetherCreateInput["generationTimes"];
  humanReview: {
    required: true;
    completed: true;
    reviewedAt: string;
    reviewType: "manual_notes_and_editable_ai_outputs";
  };
  createdAt: string;
  updatedAt: string;
};

export type CandidateInsightOption = {
  id: string;
  jobProfileId: string;
  title: string;
  candidateSource: string | null;
  createdAt: string;
  summary: CandidateInsightDto["summary"];
};

export type RecruitTogetherPageData = {
  jobProfiles: JobProfileDto[];
  candidateInsights: CandidateInsightOption[];
};

export type RecruitTogetherPromptInput = JsonObject & {
  jobProfile: JsonObject;
  candidateInsight: JsonObject;
  phonePreparation?: JsonObject;
  phoneNotes?: JsonObject;
  interviewPreparation?: JsonObject;
  interviewNotes?: JsonObject;
};

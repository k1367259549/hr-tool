import type { Prisma } from "@prisma/client";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { JobProfileDto } from "@/types/jobProfile";

export type CandidateResumeParsingStatus = "PARSED" | "FAILED";

export type ResumeChunkType =
  | "Personal Information"
  | "Education"
  | "Experience"
  | "Projects"
  | "Skills"
  | "Certificates"
  | "Languages"
  | "Achievements"
  | "Other";

export type ResumeStructureChunk = {
  chunkId: string;
  chunkType: ResumeChunkType;
  content: string;
  sourceLocation: string;
  confidence: number;
};

export type ResumeSemanticChunk = {
  chunkId: string;
  chunkType: string;
  content: string;
  evidenceChunkIds: string[];
  confidence: number;
};

export type CandidateInsightSummary = {
  candidateOverview: string;
  roleContextUnderstanding: string;
  evidenceCoverage: string;
};

export type CandidateInsightDetails = {
  relevantExperience: string[];
  transferableStrengths: string[];
  contextSignals: string[];
  openQuestions: string[];
};

export type CandidateInsightEvidence = {
  claim: string;
  sourceChunkIds: string[];
  quote?: string;
};

export type CandidateInsightOutput = {
  summary: CandidateInsightSummary;
  insights: CandidateInsightDetails;
  strengths: string[];
  potentialRisks: string[];
  missingInformation: string[];
  suggestedPhoneScreenQuestions: string[];
  suggestedInterviewQuestions: string[];
  suggestedNextActions: string[];
  evidence: CandidateInsightEvidence[];
};

export type CandidateUnderstandingGenerateInput = {
  jobProfileId: string;
  file: File;
  candidateSource?: string;
  notes?: string;
};

export type CandidateUnderstandingResult = CandidateInsightOutput & {
  workflowId: string;
  resumeId: string;
  jobProfileId: string;
  jobProfileTitle: string;
  jobProfileVersion: string;
  resumeVersion: string;
  resumeFileName: string;
  parsingStatus: CandidateResumeParsingStatus;
  parsingError?: string;
  parsedTextPreview: string;
  structureChunks: ResumeStructureChunk[];
  semanticChunks: ResumeSemanticChunk[];
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs?: number;
  generatedAt: string;
  resumeInputMetadata: CandidateUnderstandingResumeInputMetadata;
  fallbackDraft?: boolean;
  generationError?: string;
};

export type CandidateInsightCreateInput = CandidateInsightOutput & {
  workflowId: string;
  jobProfileId: string;
  resumeId: string;
  candidateSource?: string;
  notes?: string;
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs?: number;
  jobProfileVersion: string;
  resumeVersion: string;
};

export type CandidateResume = {
  id: string;
  workflowId: string;
  jobProfileId: string | null;
  candidateId: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalFile: Uint8Array<ArrayBuffer>;
  parsedText: string | null;
  parsingStatus: string;
  parsingError: string | null;
  structureChunks: Prisma.JsonValue;
  semanticChunks: Prisma.JsonValue;
  resumeVersion: string;
  candidateSource: string | null;
  notes: string | null;
  intakeSource: string | null;
  contentHash: string | null;
  language: string | null;
  parserVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateInsight = {
  id: string;
  workflowId: string;
  jobProfileId: string;
  resumeId: string;
  candidateSource: string | null;
  notes: string | null;
  summary: Prisma.JsonValue;
  insights: Prisma.JsonValue;
  strengths: string[];
  potentialRisks: string[];
  missingInformation: string[];
  suggestedPhoneScreenQuestions: string[];
  suggestedInterviewQuestions: string[];
  suggestedNextActions: string[];
  evidence: Prisma.JsonValue;
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs: number | null;
  jobProfileVersion: string;
  resumeVersion: string;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateInsightDto = Omit<
  CandidateInsight,
  "summary" | "insights" | "evidence" | "reviewedAt" | "createdAt" | "updatedAt"
> & {
  summary: CandidateInsightSummary;
  insights: CandidateInsightDetails;
  evidence: CandidateInsightEvidence[];
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateUnderstandingPageData = {
  jobProfiles: JobProfileDto[];
};

export type CandidateUnderstandingFormValues = {
  jobProfileId: string;
  file: File | null;
  candidateSource: string;
  notes: string;
};

export type CandidateUnderstandingPromptInput = JsonObject & {
  jobProfile: JsonObject;
  resume: JsonObject;
  structureChunks: JsonValue;
  semanticChunks: JsonValue;
};

export type CandidateUnderstandingResumeInputMetadata = {
  originalLength: number;
  sentLength: number;
  truncated: boolean;
};

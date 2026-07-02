import type { ApplicationStage } from "@/types/candidateApplication";

export const applicationStages: ApplicationStage[] = [
  "NEW",
  "RESUME_SCREEN",
  "PHONE_SCREEN",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN"
];

export const applicationStageLabels: Record<ApplicationStage, string> = {
  HIRED: "Hired",
  INTERVIEW: "Interview",
  NEW: "New",
  OFFER: "Offer",
  PHONE_SCREEN: "Phone Screen",
  REJECTED: "Rejected",
  RESUME_SCREEN: "Resume Screen",
  WITHDRAWN: "Withdrawn"
};

export const terminalApplicationStages = new Set<ApplicationStage>([
  "HIRED",
  "REJECTED",
  "WITHDRAWN"
]);

export function getNextApplicationStages(stage: ApplicationStage): ApplicationStage[] {
  const transitions: Record<ApplicationStage, ApplicationStage[]> = {
    HIRED: [],
    INTERVIEW: ["PHONE_SCREEN", "OFFER", "REJECTED", "WITHDRAWN"],
    NEW: ["RESUME_SCREEN", "REJECTED", "WITHDRAWN"],
    OFFER: ["INTERVIEW", "HIRED", "REJECTED", "WITHDRAWN"],
    PHONE_SCREEN: ["RESUME_SCREEN", "INTERVIEW", "REJECTED", "WITHDRAWN"],
    REJECTED: [],
    RESUME_SCREEN: ["NEW", "PHONE_SCREEN", "REJECTED", "WITHDRAWN"],
    WITHDRAWN: []
  };

  return transitions[stage];
}

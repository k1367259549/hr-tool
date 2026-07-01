export type ResumeEvaluateInput = {
  resumeText: string;
  jobDescription: string;
};

export type ResumeEvaluateOutput = {
  summary: string;
  strengths: string[];
  risks: string[];
  matchScore: number;
  interviewQuestions: string[];
};

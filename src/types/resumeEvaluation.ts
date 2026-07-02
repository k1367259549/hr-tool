export type ResumeEvaluateInput = {
  resumeText: string;
  jobDescription: string;
};

// Legacy V1 output for `/api/ai/resume-evaluate`.
// V2 Candidate Understanding must not import or expose this scoring shape.
export type ResumeEvaluateOutput = {
  summary: string;
  strengths: string[];
  risks: string[];
  matchScore: number;
  interviewQuestions: string[];
};

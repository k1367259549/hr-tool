export type AIRequestLog = {
  id: string;
  feature: string;
  model: string;
  promptTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
};

export type AIRequestLogCreateInput = {
  feature: string;
  model: string;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
};

export type AIRequestAuditInput = AIRequestLogCreateInput;

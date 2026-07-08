"use client";

import { useMemo, useState } from "react";
import { FormField } from "@/components/shared/FormField";
import type {
  CandidateInsightDetails,
  CandidateInsightEvidence,
  CandidateInsightOutput,
  CandidateInsightSummary,
  CandidateUnderstandingResult
} from "@/types/candidateUnderstanding";
import { parseMultilineList } from "@/utils/textList";

type CandidateUnderstandingReviewPanelProps = {
  result: CandidateUnderstandingResult;
  reviewedOutput: CandidateInsightOutput;
  isGenerating: boolean;
  isSaving: boolean;
  onSummaryChange: (field: keyof CandidateInsightSummary, value: string) => void;
  onInsightListChange: (field: keyof CandidateInsightDetails, value: string[]) => void;
  onOutputListChange: (
    field: Exclude<keyof CandidateInsightOutput, "summary" | "insights" | "evidence">,
    value: string[]
  ) => void;
  onEvidenceChange: (value: CandidateInsightEvidence[]) => void;
  onRegenerate: () => Promise<void>;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

const insightFields: Array<{
  field: keyof CandidateInsightDetails;
  label: string;
}> = [
  { field: "relevantExperience", label: "相关经历" },
  { field: "transferableStrengths", label: "可迁移优势" },
  { field: "contextSignals", label: "上下文信号" },
  { field: "openQuestions", label: "开放问题" }
];

const listFields: Array<{
  field: Exclude<keyof CandidateInsightOutput, "summary" | "insights" | "evidence">;
  label: string;
}> = [
  { field: "strengths", label: "优势线索" },
  { field: "potentialRisks", label: "潜在风险" },
  { field: "missingInformation", label: "缺失信息" },
  { field: "suggestedPhoneScreenQuestions", label: "电话初筛问题" },
  { field: "suggestedInterviewQuestions", label: "面试问题" },
  { field: "suggestedNextActions", label: "建议下一步动作" }
];

export function CandidateUnderstandingReviewPanel({
  result,
  reviewedOutput,
  isGenerating,
  isSaving,
  onSummaryChange,
  onInsightListChange,
  onOutputListChange,
  onEvidenceChange,
  onRegenerate,
  onCancel,
  onSave
}: CandidateUnderstandingReviewPanelProps): JSX.Element {
  const [evidenceDraft, setEvidenceDraft] = useState<string>(
    JSON.stringify(reviewedOutput.evidence, null, 2)
  );
  const evidenceError = useMemo(() => validateEvidenceDraft(evidenceDraft), [evidenceDraft]);

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        AI 结果只是候选人理解草稿，不是录用、拒绝、排名或评分。保存前必须由 Recruiter 人工确认。
      </div>

      <div className="grid gap-3 text-xs text-slate-500 md:grid-cols-5">
        <Metadata label="Workflow ID" value={result.workflowId} />
        <Metadata label="Resume" value={result.resumeFileName} />
        <Metadata label="Provider" value={result.aiProvider} />
        <Metadata label="Prompt" value={`${result.promptFile} / v${result.promptVersion}`} />
        <Metadata
          label="AI Input"
          value={`${result.resumeInputMetadata.sentLength}/${result.resumeInputMetadata.originalLength}${
            result.resumeInputMetadata.truncated ? " truncated" : ""
          }`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FormField id="candidate-overview" label="候选人概览" required>
          <textarea
            id="candidate-overview"
            value={reviewedOutput.summary.candidateOverview}
            onChange={(event) => onSummaryChange("candidateOverview", event.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <FormField id="role-context-understanding" label="岗位上下文理解" required>
          <textarea
            id="role-context-understanding"
            value={reviewedOutput.summary.roleContextUnderstanding}
            onChange={(event) => onSummaryChange("roleContextUnderstanding", event.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <FormField id="evidence-coverage" label="证据覆盖" required>
          <textarea
            id="evidence-coverage"
            value={reviewedOutput.summary.evidenceCoverage}
            onChange={(event) => onSummaryChange("evidenceCoverage", event.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {insightFields.map((item) => (
          <FormField key={item.field} id={item.field} label={item.label}>
            <textarea
              id={item.field}
              value={reviewedOutput.insights[item.field].join("\n")}
              onChange={(event) => onInsightListChange(item.field, parseMultilineList(event.target.value))}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {listFields.map((item) => (
          <FormField key={item.field} id={item.field} label={item.label}>
            <textarea
              id={item.field}
              value={reviewedOutput[item.field].join("\n")}
              onChange={(event) => onOutputListChange(item.field, parseMultilineList(event.target.value))}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
        ))}
      </div>

      <FormField id="candidate-evidence" label="证据 JSON" error={evidenceError ?? undefined}>
        <textarea
          id="candidate-evidence"
          value={evidenceDraft}
          onChange={(event) => {
            setEvidenceDraft(event.target.value);
            const parsedValue = parseEvidenceDraft(event.target.value);

            if (parsedValue) {
              onEvidenceChange(parsedValue);
            }
          }}
          rows={8}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">解析与 Chunk 摘要</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <Metadata label="结构 Chunk" value={`${result.structureChunks.length}`} />
          <Metadata label="语义 Chunk" value={`${result.semanticChunks.length}`} />
          <Metadata label="Resume Version" value={result.resumeVersion} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isGenerating || isSaving}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          拒绝并取消
        </button>
        <button
          type="button"
          onClick={() => void onRegenerate()}
          disabled={isGenerating || isSaving}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "正在重新生成..." : "重新生成"}
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={isGenerating || isSaving || evidenceError !== null}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "正在保存..." : "确认并保存候选人洞察"}
        </button>
      </div>
    </div>
  );
}

function Metadata({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p>{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function parseEvidenceDraft(value: string): CandidateInsightEvidence[] | null {
  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    if (
      !parsedValue.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CandidateInsightEvidence).claim === "string" &&
          Array.isArray((item as CandidateInsightEvidence).sourceChunkIds)
      )
    ) {
      return null;
    }

    return parsedValue as CandidateInsightEvidence[];
  } catch {
    return null;
  }
}

function validateEvidenceDraft(value: string): string | null {
  return parseEvidenceDraft(value) ? null : "证据必须是数组 JSON，且每项包含 claim 和 sourceChunkIds。";
}

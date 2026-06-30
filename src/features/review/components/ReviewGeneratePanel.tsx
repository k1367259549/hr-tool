"use client";

import { FormField } from "@/components/shared/FormField";
import { PageActions } from "@/components/shared/PageActions";
import { SectionCard } from "@/components/shared/SectionCard";

type ReviewGeneratePanelProps = {
  selectedDate: string;
  isLoading: boolean;
  isGenerating: boolean;
  hasReview: boolean;
  onDateChange: (date: string) => void;
  onLoadReview: () => Promise<void>;
  onGenerateReview: () => Promise<void>;
};

export function ReviewGeneratePanel({
  selectedDate,
  isLoading,
  isGenerating,
  hasReview,
  onDateChange,
  onLoadReview,
  onGenerateReview
}: ReviewGeneratePanelProps): JSX.Element {
  return (
    <SectionCard
      title="每日复盘"
      description="选择每日记录日期，加载已保存的 AI 复盘，或生成新的分析。"
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onLoadReview()}
            disabled={isLoading || isGenerating}
          >
            {isLoading ? "加载中..." : "加载"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onGenerateReview()}
            disabled={isLoading || isGenerating || !selectedDate}
          >
            {isGenerating ? "生成中..." : hasReview ? "重新生成复盘" : "生成复盘"}
          </button>
        </PageActions>
      }
    >
      <FormField id="review-date" label="日期" required>
        <input
          id="review-date"
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xs"
        />
      </FormField>
    </SectionCard>
  );
}

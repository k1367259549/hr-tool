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
      title="Daily Review"
      description="Select a daily log date, load any saved AI review, or generate a fresh analysis."
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onLoadReview()}
            disabled={isLoading || isGenerating}
          >
            {isLoading ? "Loading..." : "Load"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onGenerateReview()}
            disabled={isLoading || isGenerating || !selectedDate}
          >
            {isGenerating ? "Generating..." : hasReview ? "Regenerate Review" : "Generate Review"}
          </button>
        </PageActions>
      }
    >
      <FormField id="review-date" label="Date" required>
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

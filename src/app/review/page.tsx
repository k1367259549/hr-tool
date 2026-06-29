"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ReviewGeneratePanel } from "@/features/review/components/ReviewGeneratePanel";
import { ReviewResult } from "@/features/review/components/ReviewResult";
import { useReview } from "@/features/review/hooks/useReview";

export default function ReviewPage(): JSX.Element {
  const review = useReview();

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Review"
        description="Generate and view structured AI analysis for a selected daily recruiting log."
      />
      <ReviewGeneratePanel
        selectedDate={review.selectedDate}
        isLoading={review.isLoading}
        isGenerating={review.isGenerating}
        hasReview={review.hasReview}
        onDateChange={review.updateDate}
        onLoadReview={review.loadReview}
        onGenerateReview={review.generateReview}
      />
      {review.errorMessage ? (
        <ErrorState
          title="Unable to load AI review"
          message={review.errorMessage}
          action={
            <button
              type="button"
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={review.dismissError}
            >
              Dismiss
            </button>
          }
        />
      ) : null}
      {review.isLoading ? (
        <LoadingState title="Loading review" description="Checking for a saved AI review." />
      ) : review.isGenerating ? (
        <LoadingState
          title="Generating review"
          description="AI is analyzing the selected daily recruiting log."
        />
      ) : review.review ? (
        <ReviewResult review={review.review} />
      ) : (
        <EmptyState
          title="No AI review for this date"
          description="Select a date with a daily log, then generate an AI review."
        />
      )}
    </div>
  );
}

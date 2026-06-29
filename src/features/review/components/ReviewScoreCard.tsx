"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import type { ReviewResultView } from "@/types/review";

type ReviewScoreCardProps = {
  review: ReviewResultView;
};

export function ReviewScoreCard({ review }: ReviewScoreCardProps): JSX.Element {
  return (
    <KpiCard
      title="Daily Score"
      value={review.scoreLabel}
      description={`Review for ${review.dateLabel}`}
      footer={`Generated ${review.generatedAtLabel}`}
      tone={review.scoreTone}
    />
  );
}

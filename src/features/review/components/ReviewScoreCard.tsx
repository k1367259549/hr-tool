"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import type { ReviewResultView } from "@/types/review";

type ReviewScoreCardProps = {
  review: ReviewResultView;
};

export function ReviewScoreCard({ review }: ReviewScoreCardProps): JSX.Element {
  return (
    <KpiCard
      title="每日评分"
      value={review.scoreLabel}
      description={`${review.dateLabel} 的复盘`}
      footer={`生成时间：${review.generatedAtLabel}`}
      tone={review.scoreTone}
    />
  );
}

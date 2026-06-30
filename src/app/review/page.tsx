"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportMarkdownButton } from "@/components/shared/ExportMarkdownButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/ToastProvider";
import { ReviewGeneratePanel } from "@/features/review/components/ReviewGeneratePanel";
import { ReviewResult } from "@/features/review/components/ReviewResult";
import { useReview } from "@/features/review/hooks/useReview";

export default function ReviewPage(): JSX.Element {
  const review = useReview();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = review;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI 复盘"
        description="为选中的每日招聘记录生成并查看结构化 AI 分析。"
      />
      <div className="flex justify-end">
        <ExportMarkdownButton date={review.selectedDate} />
      </div>
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
          title="无法加载 AI 复盘"
          message={review.errorMessage}
          actionLabel="关闭"
          onAction={review.dismissError}
        />
      ) : null}
      {review.isLoading ? (
        <LoadingState title="正在加载复盘" description="正在检查是否已有保存的 AI 复盘。" />
      ) : review.isGenerating ? (
        <LoadingState
          title="正在生成复盘"
          description="AI 正在分析选中的每日招聘记录。"
        />
      ) : review.review ? (
        <ReviewResult review={review.review} />
      ) : (
        <EmptyState
          title="该日期暂无 AI 复盘"
          description="请选择已有每日记录的日期，然后生成 AI 复盘。"
        />
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportMarkdownButton } from "@/components/shared/ExportMarkdownButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/ToastProvider";
import { PlannerFocusCard } from "@/features/planner/components/PlannerFocusCard";
import { PlannerGeneratePanel } from "@/features/planner/components/PlannerGeneratePanel";
import { PlannerTaskList } from "@/features/planner/components/PlannerTaskList";
import { usePlanner } from "@/features/planner/hooks/usePlanner";

export default function PlannerPage(): JSX.Element {
  const planner = usePlanner();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = planner;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="明日计划"
        description="生成并查看结构化的次日招聘工作计划。"
      />
      <div className="flex justify-end">
        <ExportMarkdownButton date={getReportDateForPlan(planner.selectedDate)} />
      </div>
      <PlannerGeneratePanel
        selectedDate={planner.selectedDate}
        isLoading={planner.isLoading}
        isGenerating={planner.isGenerating}
        hasPlan={planner.hasPlan}
        onDateChange={planner.updateDate}
        onLoadPlan={planner.loadPlan}
        onGeneratePlan={planner.generatePlan}
      />
      {planner.errorMessage ? (
        <ErrorState
          title="无法加载计划"
          message={planner.errorMessage}
          actionLabel="关闭"
          onAction={planner.dismissError}
        />
      ) : null}
      {planner.isLoading ? (
        <LoadingState title="正在加载计划" description="正在检查是否已有保存的计划。" />
      ) : planner.isGenerating ? (
        <LoadingState
          title="正在生成计划"
          description="AI 正在创建选中日期的次日招聘计划。"
        />
      ) : planner.plan ? (
        <div className="space-y-6">
          <PlannerFocusCard plan={planner.plan} />
          <PlannerTaskList schedule={planner.plan.schedule} />
        </div>
      ) : (
        <EmptyState
          title="该日期暂无计划"
          description="请选择前一天已有招聘记录的目标日期，然后生成计划。"
        />
      )}
    </div>
  );
}

function getReportDateForPlan(planDate: string): string {
  if (!planDate) {
    return "";
  }

  const date = new Date(`${planDate}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

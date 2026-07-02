import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const dailyWorkspaceModule: FeishuModuleDefinition = {
  title: "Daily Workspace",
  href: "/feishu/daily-workspace",
  marker: "DW",
  description: "每日招聘工作入口，汇总今日活动、生成招聘洞察、准备明日优先级。",
  placeholder: "Workflow-04 已接入今日工作采集、Daily Summary、Recruiting Insights、Tomorrow Priorities 和 Improvement Suggestions。",
  metrics: [
    { label: "Workflow", value: "Daily Workspace" },
    { label: "Learning Assets", value: "不自动创建" },
    { label: "Review", value: "人工确认" }
  ],
  nextSteps: ["每日复盘", "明日计划", "后续 Learning Assets 人工发布"]
};

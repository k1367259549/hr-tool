import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const interviewModule: FeishuModuleDefinition = {
  title: "面试记录",
  href: "/feishu/interviews",
  marker: "I",
  description: "面试安排、反馈收集和评估记录的 V2 工作区骨架。",
  placeholder: "面试日程、反馈表和飞书日历联动将在后续任务中接入。",
  metrics: [
    { label: "今日面试", value: "待同步" },
    { label: "反馈缺口", value: "待统计" },
    { label: "日历联动", value: "未接入" }
  ],
  nextSteps: ["面试轮次设计", "面试反馈模板", "飞书日历集成方案"]
};

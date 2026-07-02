import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const recruitmentTaskCenterModule: FeishuModuleDefinition = {
  title: "任务中心",
  href: "/feishu/tasks",
  marker: "T",
  description: "从岗位理解、候选人理解、Recruit Together、Daily Workspace 和 Recruiter Notes 生成下一步招聘动作。",
  placeholder: "Workflow-06 已接入任务生成、优先级解释、人工确认、状态流转和审计。",
  metrics: [
    { label: "Workflow", value: "Task Center" },
    { label: "执行规则", value: "人工控制" },
    { label: "自动动作", value: "不执行" }
  ],
  nextSteps: ["任务过滤", "日程联动", "更细的审计视图"]
};

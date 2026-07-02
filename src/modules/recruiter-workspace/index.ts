import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const recruiterWorkspaceModule: FeishuModuleDefinition = {
  title: "AI 工作台",
  href: "/feishu",
  marker: "AI",
  description: "Recruiter 每日首页，按岗位、候选人、日程和下一步动作组织一天的招聘工作。",
  placeholder: "Workflow-05 已接入今日岗位、候选人行动、AI 建议、日程、快捷入口和 Recruiter Notes。",
  metrics: [
    { label: "定位", value: "每日工作入口" },
    { label: "决策", value: "Recruiter 控制" },
    { label: "Learning Assets", value: "不自动创建" }
  ],
  nextSteps: ["接入真实候选人库", "连接日历", "后续 Talent Map"]
};

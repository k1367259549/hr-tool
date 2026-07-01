import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const recruitTogetherModule: FeishuModuleDefinition = {
  title: "Recruit Together",
  href: "/feishu/recruit-together",
  marker: "RT",
  description: "基于已确认岗位画像和候选人洞察，协作完成电话初筛、面试准备和 Recruiter Summary。",
  placeholder: "Workflow-03 已接入电话准备、人工电话笔记、面试准备、人工面试记录和协作总结。",
  metrics: [
    { label: "Workflow", value: "Recruit Together" },
    { label: "AI 角色", value: "Copilot" },
    { label: "决策规则", value: "人工确认" }
  ],
  nextSteps: ["候选人库转换", "面试记录归档", "Pipeline 人工流转"]
};

import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const jobProfileModule: FeishuModuleDefinition = {
  title: "岗位理解",
  href: "/feishu/job-profile/new",
  marker: "JP",
  description: "粘贴 JD 和业务背景，生成可人工确认的岗位画像。",
  placeholder: "Workflow-01 已接入 AI 岗位理解、人工 Review 和保存确认。",
  metrics: [
    { label: "Workflow", value: "Job Understanding" },
    { label: "AI 输出", value: "JSON" },
    { label: "保存规则", value: "人工确认" }
  ],
  nextSteps: ["岗位画像列表", "候选人理解", "简历解析上下文"]
};

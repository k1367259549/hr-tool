import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const resumeModule: FeishuModuleDefinition = {
  title: "简历解析",
  href: "/feishu/resumes",
  marker: "R",
  description: "简历解析、匹配分析和候选人关联的 V2 工作区骨架。",
  placeholder: "简历上传、AI 解析和岗位匹配将在后续任务中接入。",
  metrics: [
    { label: "待解析简历", value: "待接入" },
    { label: "AI 评估", value: "已规划" },
    { label: "岗位匹配", value: "待配置" }
  ],
  nextSteps: ["简历上传入口", "结构化解析字段", "AI 简历评估结果展示"]
};

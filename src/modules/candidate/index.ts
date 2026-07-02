import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const candidateModule: FeishuModuleDefinition = {
  title: "候选人管理",
  href: "/feishu/candidates",
  marker: "C",
  description: "候选人档案、来源和跟进状态的 V2 工作区骨架。",
  placeholder: "候选人列表、详情和跟进记录将在后续任务中接入。",
  metrics: [
    { label: "候选人池", value: "待接入" },
    { label: "重点跟进", value: "待配置" },
    { label: "来源渠道", value: "待同步" }
  ],
  nextSteps: ["候选人档案字段设计", "候选人来源标签", "与简历和 Pipeline 建立关联"]
};

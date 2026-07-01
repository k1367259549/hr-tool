import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const offerModule: FeishuModuleDefinition = {
  title: "Offer 管理",
  href: "/feishu/offers",
  marker: "O",
  description: "Offer 审批、发放、接受和入职衔接的 V2 工作区骨架。",
  placeholder: "Offer 模板、审批流和状态追踪将在后续任务中接入。",
  metrics: [
    { label: "待审批", value: "待接入" },
    { label: "已发出", value: "待统计" },
    { label: "入职衔接", value: "待规划" }
  ],
  nextSteps: ["Offer 状态机", "审批流字段", "入职交接节点"]
};

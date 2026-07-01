import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const pipelineModule: FeishuModuleDefinition = {
  title: "招聘流程",
  href: "/feishu/pipeline",
  marker: "P",
  description: "招聘流程看板、阶段流转和漏斗跟踪的 V2 工作区骨架。",
  placeholder: "Pipeline 阶段配置、候选人拖拽和飞书同步将在后续任务中接入。",
  metrics: [
    { label: "流程阶段", value: "7 个规划" },
    { label: "转化漏斗", value: "待接入" },
    { label: "阶段同步", value: "未启用" }
  ],
  nextSteps: ["定义阶段字典", "候选人阶段历史", "飞书状态同步边界"]
};

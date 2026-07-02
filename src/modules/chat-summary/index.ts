import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const chatSummaryModule: FeishuModuleDefinition = {
  title: "聊天纪要",
  href: "/feishu/chat-summary",
  marker: "CS",
  description: "沉淀飞书招聘沟通内容、候选人关键反馈和待办事项的页面骨架。",
  placeholder: "聊天记录解析、纪要归档和待办提取将在后续任务中接入。",
  metrics: [
    { label: "沟通来源", value: "待接入" },
    { label: "待办提取", value: "待规划" },
    { label: "同步状态", value: "未启用" }
  ],
  nextSteps: ["定义纪要字段", "规划飞书消息边界", "关联候选人与面试记录"]
};

import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const candidateUnderstandingModule: FeishuModuleDefinition = {
  title: "候选人理解",
  href: "/feishu/candidate-understanding/new",
  marker: "CU",
  description: "基于已确认岗位画像和简历证据，生成可人工确认的候选人洞察。",
  placeholder: "Workflow-02 已接入简历解析、结构 Chunk、语义 Chunk、AI 候选人理解和人工 Review。",
  metrics: [
    { label: "Workflow", value: "Candidate Understanding" },
    { label: "文件类型", value: "PDF / DOCX / TXT" },
    { label: "保存规则", value: "人工确认" }
  ],
  nextSteps: ["候选人洞察列表", "候选人库转换", "电话初筛记录"]
};

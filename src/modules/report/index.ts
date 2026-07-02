import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const reportModule: FeishuModuleDefinition = {
  title: "招聘报告",
  href: "/feishu/report",
  marker: "RP",
  description: "面向招聘负责人和业务方的阶段性招聘进展报告页面骨架。",
  placeholder: "招聘日报、周报、岗位进展和风险摘要将在后续任务中接入。",
  metrics: [
    { label: "报告周期", value: "待选择" },
    { label: "岗位进展", value: "待统计" },
    { label: "风险摘要", value: "待生成" }
  ],
  nextSteps: ["定义报告模板", "接入 Pipeline 汇总", "生成飞书可分享摘要"]
};

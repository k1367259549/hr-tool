import { candidateModule } from "@/modules/candidate";
import { candidateUnderstandingModule } from "@/modules/candidate-understanding";
import { chatSummaryModule } from "@/modules/chat-summary";
import { dailyWorkspaceModule } from "@/modules/daily-workspace";
import { interviewModule } from "@/modules/interview";
import { jobProfileModule } from "@/modules/job-profile";
import { offerModule } from "@/modules/offer";
import { pipelineModule } from "@/modules/pipeline";
import { reportModule } from "@/modules/report";
import { resumeModule } from "@/modules/resume";
import { recruitTogetherModule } from "@/modules/recruit-together";
import { recruitmentTaskCenterModule } from "@/modules/recruitment-task-center";
import { recruiterWorkspaceModule } from "@/modules/recruiter-workspace";
import type { FeishuModuleDefinition } from "@/modules/feishu/types";

export const feishuSettingsModule: FeishuModuleDefinition = {
  title: "飞书集成设置",
  href: "/feishu/settings",
  marker: "F",
  description: "飞书应用配置、授权状态和同步策略的 V2 工作区骨架。",
  placeholder: "飞书 App ID、回调、权限和同步状态将在后续任务中接入。",
  metrics: [
    { label: "连接状态", value: "未接入" },
    { label: "权限范围", value: "待确认" },
    { label: "同步任务", value: "未启用" }
  ],
  nextSteps: ["飞书应用配置说明", "后端 token 管理", "同步日志和错误处理"]
};

export const resumeEvaluationModule: FeishuModuleDefinition = {
  title: "AI 简历评估",
  href: "/feishu/resumes",
  marker: "AI",
  description: "基于简历文本和岗位描述输出匹配摘要、优势、风险、分数和面试问题。",
  placeholder: "AI 简历评估能力将复用后端 AI service，不在前端暴露 API Key。",
  metrics: [
    { label: "输出格式", value: "JSON" },
    { label: "匹配分", value: "0-100" },
    { label: "调用位置", value: "后端" }
  ],
  nextSteps: ["评估结果展示区", "岗位描述输入", "面试问题推荐"]
};

export const evaluationTemplateModule: FeishuModuleDefinition = {
  title: "评价标准",
  href: "/feishu/evaluation-templates",
  marker: "ET",
  description: "管理可配置、可版本化并可分配给已确认岗位画像的招聘评价标准。",
  placeholder: "评价标准已接入模板、版本和岗位分配基础，不自动执行简历评估。",
  metrics: [
    { label: "标准内容", value: "Versioned" },
    { label: "岗位分配", value: "人工确认" },
    { label: "自动决策", value: "不支持" }
  ],
  nextSteps: ["维护评价维度", "发布不可变版本", "分配给已确认岗位画像"]
};

export const feishuModules: FeishuModuleDefinition[] = [
  recruiterWorkspaceModule,
  recruitmentTaskCenterModule,
  dailyWorkspaceModule,
  jobProfileModule,
  evaluationTemplateModule,
  candidateUnderstandingModule,
  recruitTogetherModule,
  candidateModule,
  resumeModule,
  pipelineModule,
  interviewModule,
  offerModule,
  reportModule,
  chatSummaryModule,
  feishuSettingsModule
];

export const feishuHomeModules: FeishuModuleDefinition[] = [
  recruiterWorkspaceModule,
  recruitmentTaskCenterModule,
  dailyWorkspaceModule,
  jobProfileModule,
  evaluationTemplateModule,
  candidateUnderstandingModule,
  recruitTogetherModule,
  candidateModule,
  resumeModule,
  resumeEvaluationModule,
  pipelineModule,
  interviewModule,
  offerModule,
  reportModule,
  chatSummaryModule,
  feishuSettingsModule
];

export function findFeishuModule(href: string): FeishuModuleDefinition | undefined {
  return feishuModules.find((module) => module.href === href);
}

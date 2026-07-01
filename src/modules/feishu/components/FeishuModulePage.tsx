import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { FeishuModuleDefinition } from "@/modules/feishu/types";

type FeishuModulePageProps = {
  module: FeishuModuleDefinition;
};

export function FeishuModulePage({ module }: FeishuModulePageProps): JSX.Element {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Feishu Recruiting AI V2
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{module.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{module.description}</p>
      </header>

      <SectionCard title="模块状态" description="当前阶段仅提供 V2 路由和页面骨架。">
        <div className="space-y-6">
          <EmptyState title={`${module.title}模块已创建`} description={module.placeholder} />

          <div className="grid gap-3 md:grid-cols-3">
            {module.metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="后续接入计划" description="仅展示静态规划，不连接数据库或飞书 API。">
        <ul className="grid gap-3 md:grid-cols-3">
          {module.nextSteps.map((step) => (
            <li key={step} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {step}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="继续工作" description="返回已接入的 AI Recruiter 工作流，不停留在占位模块。">
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/feishu" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-950">AI 工作台</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">查看今天要做什么。</p>
          </Link>
          <Link href="/feishu/tasks" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-950">任务中心</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">处理下一步招聘动作。</p>
          </Link>
          <Link href="/feishu/daily-workspace" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-950">Daily Workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">完成当天复盘。</p>
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}

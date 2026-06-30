import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function Home(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="HR Daily AI"
        description="面向桌面端的招聘运营工作台，用于每日记录、KPI 查看、AI 复盘、计划生成和知识沉淀。"
      />
      <EmptyState
        title="应用已准备就绪"
        description="从侧边栏选择模块即可开始使用。"
      />
    </div>
  );
}

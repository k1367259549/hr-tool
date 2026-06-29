import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function Home(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="HR Daily AI"
        description="A desktop-first recruiting operations shell for daily logs, KPI visibility, AI review, planning, and reusable knowledge."
      />
      <EmptyState
        title="Application shell ready"
        description="Select a module from the sidebar to open its placeholder page."
      />
    </div>
  );
}

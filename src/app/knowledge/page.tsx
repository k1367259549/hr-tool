import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function KnowledgePage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Base"
        description="Store reusable recruiting experience, templates, position notes, and AI-extracted knowledge."
      />
      <EmptyState
        title="No knowledge entries yet"
        description="Knowledge filters, entries, and creation flows will be added in their dedicated implementation task."
      />
    </div>
  );
}

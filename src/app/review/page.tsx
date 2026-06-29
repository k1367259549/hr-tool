import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ReviewPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Review"
        description="Display structured AI analysis of daily recruiting work, including score, summary, strengths, weaknesses, and suggestions."
      />
      <EmptyState
        title="No AI review yet"
        description="Review generation and cached AI output display will be implemented in a later task."
      />
    </div>
  );
}

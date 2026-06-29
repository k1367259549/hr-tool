import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function LogPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Log"
        description="Record structured recruiting activity including screening, communication, interviews, offers, entries, and reflection."
      />
      <EmptyState
        title="Daily log form pending"
        description="Daily log inputs and save behavior will be added here after the base layout is complete."
      />
    </div>
  );
}

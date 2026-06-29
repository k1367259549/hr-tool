import { PageHeader } from "@/components/layout/PageHeader";

export default function KnowledgePage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Base"
        description="Store reusable recruiting experience, templates, position notes, and AI-extracted knowledge."
      />
      <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="max-w-lg text-sm leading-6 text-slate-500">
          Knowledge filters, entries, and creation flows will be added in their dedicated implementation task.
        </p>
      </section>
    </div>
  );
}

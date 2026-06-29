import { PageHeader } from "@/components/layout/PageHeader";

export default function ReviewPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Review"
        description="Display structured AI analysis of daily recruiting work, including score, summary, strengths, weaknesses, and suggestions."
      />
      <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="max-w-lg text-sm leading-6 text-slate-500">
          Review generation and cached AI output display will be implemented in a later task.
        </p>
      </section>
    </div>
  );
}

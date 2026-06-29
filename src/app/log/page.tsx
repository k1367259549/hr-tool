import { PageHeader } from "@/components/layout/PageHeader";

export default function LogPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Log"
        description="Record structured recruiting activity including screening, communication, interviews, offers, entries, and reflection."
      />
      <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="max-w-lg text-sm leading-6 text-slate-500">
          Daily log inputs and save behavior will be added here after the base layout is complete.
        </p>
      </section>
    </div>
  );
}

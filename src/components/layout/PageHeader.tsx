type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps): JSX.Element {
  return (
    <header className="border-b border-slate-200 pb-5">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">HR Daily AI</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </header>
  );
}

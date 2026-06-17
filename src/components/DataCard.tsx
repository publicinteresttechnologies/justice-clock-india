type DataCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function DataCard({ title, description, eyebrow }: DataCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}

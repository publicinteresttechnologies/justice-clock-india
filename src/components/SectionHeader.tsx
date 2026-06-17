type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="text-base leading-7 text-slate-700">{description}</p> : null}
    </header>
  );
}

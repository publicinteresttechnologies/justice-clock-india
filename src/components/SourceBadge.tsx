type SourceBadgeProps = {
  label: string;
  href?: string;
};

export function SourceBadge({ label, href }: SourceBadgeProps) {
  const className = "inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600";

  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        Source: {label}
      </a>
    );
  }

  return <span className={className}>Source: {label}</span>;
}

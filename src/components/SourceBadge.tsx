type SourceBadgeProps = {
  name: string;
  url?: string;
};

export function SourceBadge({ name, url }: SourceBadgeProps) {
  const className =
    "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700";

  if (!url) {
    return <span className={className}>{name}</span>;
  }

  return (
    <a href={url} className={className} rel="noreferrer" target="_blank">
      {name}
    </a>
  );
}

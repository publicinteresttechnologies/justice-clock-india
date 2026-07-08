import { sortedEntries } from "@/lib/format";

type KeyValueListProps = {
  items: Record<string, number> | { benchSize: string; pending: number }[];
  emptyLabel?: string;
};

export function KeyValueList({
  items,
  emptyLabel = "No sample records available.",
}: KeyValueListProps) {
  const entries = Array.isArray(items)
    ? items.map((item) => [item.benchSize, item.pending] as const)
    : sortedEntries(items);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-600">{emptyLabel}</p>;
  }

  return (
    <dl className="space-y-3">
      {entries.map(([label, value]) => (
        <div
          className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
          key={label}
        >
          <dt className="text-sm text-slate-600">{label}</dt>
          <dd className="text-sm font-semibold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

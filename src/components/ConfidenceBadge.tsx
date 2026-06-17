export type ConfidenceLevel = "high" | "medium-high" | "medium" | "low" | "experimental";

const styles: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "medium-high": "border-sky-200 bg-sky-50 text-sky-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-rose-200 bg-rose-50 text-rose-800",
  experimental: "border-slate-200 bg-slate-100 text-slate-700",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${styles[level]}`}>
      {level.replace("-", " ")}
    </span>
  );
}

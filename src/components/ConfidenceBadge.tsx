export type ConfidenceLevel =
  | "high"
  | "medium-high"
  | "medium"
  | "low"
  | "experimental";

const confidenceStyles: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "medium-high": "border-lime-200 bg-lime-50 text-lime-900",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-red-200 bg-red-50 text-red-900",
  experimental: "border-slate-300 bg-slate-100 text-slate-800",
};

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${confidenceStyles[level]}`}
    >
      {level.replace("-", " ")} confidence
    </span>
  );
}

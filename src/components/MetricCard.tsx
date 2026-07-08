type MetricTone = "neutral" | "warning" | "danger" | "positive";

const toneStyles: Record<MetricTone, string> = {
  neutral: "border-slate-200 bg-white",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
  positive: "border-emerald-200 bg-emerald-50",
};

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: MetricTone;
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${toneStyles[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
        {value}
      </p>
      {helper ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>
      ) : null}
    </article>
  );
}

import { ConfidenceBadge, type ConfidenceLevel } from "./ConfidenceBadge";
import { SourceBadge } from "./SourceBadge";

type MetricCardProps = {
  title: string;
  value: string;
  context?: string;
  confidence?: ConfidenceLevel;
  sourceLabel?: string;
  sourceHref?: string;
};

export function MetricCard({
  title,
  value,
  context,
  confidence,
  sourceLabel,
  sourceHref,
}: MetricCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-5xl font-black tracking-tight text-slate-950">{value}</p>
      {context ? <p className="mt-3 text-sm leading-6 text-slate-600">{context}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {confidence ? <ConfidenceBadge level={confidence} /> : null}
        {sourceLabel ? <SourceBadge label={sourceLabel} href={sourceHref} /> : null}
      </div>
    </section>
  );
}

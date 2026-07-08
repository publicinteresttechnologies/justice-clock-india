import { DataCard } from "@/components/DataCard";
import { MetricCard } from "@/components/MetricCard";
import { formatNumber } from "@/lib/format";
import type { SiteSummary } from "@/lib/schemas";

type DataHealthPanelProps = {
  summary: SiteSummary;
};

export function DataHealthPanel({ summary }: DataHealthPanelProps) {
  const yearRange =
    summary.earliestJudgmentYear && summary.latestJudgmentYear
      ? `${summary.earliestJudgmentYear}-${summary.latestJudgmentYear}`
      : "Not available";

  return (
    <DataCard title="Dataset Scope">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Judgment records"
          value={formatNumber(summary.totalJudgments)}
        />
        <MetricCard label="Years covered" value={yearRange} />
        <MetricCard label="Case types" value={summary.caseTypeCount} />
        <MetricCard label="Judge profiles" value={summary.judgeProfileCount} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Generated {new Date(summary.generatedAt).toLocaleString("en-IN")}.
      </p>
    </DataCard>
  );
}

import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";
import { sources } from "@/lib/data";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="Every source shown here is sample-marked until official or generated data is connected."
        title="Sources"
      />

      {sources.map((source) => (
        <DataCard
          key={`${source.sourceName}-${source.sourceUrl ?? "no-url"}`}
          subtitle={source.sourceUrl ?? "No source URL supplied"}
          title={source.sourceName}
        >
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <p>Proves: {source.proves}</p>
            <p>Does not prove: {source.doesNotProve}</p>
            <p>Last captured/updated: {source.lastUpdated}</p>
            <ConfidenceBadge level={source.confidence} />
          </div>
        </DataCard>
      ))}
    </div>
  );
}

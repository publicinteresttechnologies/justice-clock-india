import Link from "next/link";
import { notFound } from "next/navigation";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { KeyValueList } from "@/components/KeyValueList";
import { MetricCard } from "@/components/MetricCard";
import { ProfileDisclaimer } from "@/components/ProfileDisclaimer";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { SourceBadge } from "@/components/SourceBadge";
import { caseTypes } from "@/lib/data";
import { formatYears } from "@/lib/format";

type CaseTypePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return caseTypes.map((item) => ({ slug: item.slug }));
}

export default async function CaseTypePage({ params }: CaseTypePageProps) {
  const { slug } = await params;
  const item = caseTypes.find((caseType) => caseType.slug === slug);

  if (!item) {
    notFound();
  }

  const related = caseTypes
    .filter((caseType) => caseType.slug !== item.slug)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          {item.caseType}
        </h1>
        <ConfidenceBadge level={item.confidence} />
      </section>

      <MetricCard
        label="Median approximate case-age-to-judgment"
        tone="warning"
        value={formatYears(item.medianCaseAgeYears)}
      />

      <ProfileDisclaimer />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="P25" value={formatYears(item.p25CaseAgeYears)} />
        <MetricCard label="P75" value={formatYears(item.p75CaseAgeYears)} />
        <MetricCard label="P90" value={formatYears(item.p90CaseAgeYears)} />
        <MetricCard
          label="Oldest sample"
          value={formatYears(item.oldestCaseAgeYears)}
        />
      </div>

      <MetricCard label="Sample size" value={item.sampleSize} />

      <DataCard title="Judgments by Year">
        <KeyValueList items={item.judgmentsByYear} />
      </DataCard>

      <DataCard title="Judgment Timeline">
        <SimpleBarChart
          data={Object.entries(item.judgmentsByYear).map(([label, value]) => ({
            label,
            value,
          }))}
        />
      </DataCard>

      <DataCard title="Approximate Gap Distribution">
        <SimpleBarChart
          data={[
            { label: "P25", value: item.p25CaseAgeYears ?? 0 },
            { label: "Median", value: item.medianCaseAgeYears ?? 0 },
            { label: "P75", value: item.p75CaseAgeYears ?? 0 },
            { label: "P90", value: item.p90CaseAgeYears ?? 0 },
          ]}
          valueLabel={(value) => formatYears(value)}
        />
      </DataCard>

      <div className="flex flex-wrap gap-2">
        {item.sources.map((source) => (
          <SourceBadge
            key={source.sourceUrl}
            name={source.sourceName}
            url={source.sourceUrl ?? undefined}
          />
        ))}
      </div>

      <CaveatBox>
        This measures the gap between case/diary year and judgment year where
        exact filing-to-disposal dates are not available. It is an
        approximation, not a prediction for your case.
      </CaveatBox>

      <DataCard title="Related Case Types">
        <div className="space-y-2">
          {related.map((caseType) => (
            <Link
              className="block text-sm font-semibold text-amber-900"
              href={`/case-types/${caseType.slug}`}
              key={caseType.slug}
            >
              {caseType.caseType}
            </Link>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

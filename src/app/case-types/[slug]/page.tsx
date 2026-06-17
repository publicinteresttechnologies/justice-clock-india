import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { getCaseTypeBySlug, formatYears } from "@/lib/data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CaseTypeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const caseType = getCaseTypeBySlug(slug);

  if (!caseType) notFound();

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Case Type"
        title={caseType.caseType}
        description="Approximate case-age-to-judgment profile from generated judgment metadata."
      />

      {caseType.sample ? <SampleDataWarning /> : null}

      <MetricCard
        title="Median Time to Judgment"
        value={formatYears(caseType.medianCaseAgeYears)}
        context={`Based on ${caseType.sampleSize} judgment record${caseType.sampleSize === 1 ? "" : "s"}.`}
        confidence={caseType.confidence}
        sourceLabel={caseType.sources[0]?.name ?? "Generated data"}
        sourceHref={caseType.sources[0]?.url}
      />

      <AdSlot slotName="case-type-after-answer" />

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard title="25th Percentile" value={formatYears(caseType.p25CaseAgeYears)} confidence={caseType.confidence} />
        <MetricCard title="75th Percentile" value={formatYears(caseType.p75CaseAgeYears)} confidence={caseType.confidence} />
        <MetricCard title="90th Percentile" value={formatYears(caseType.p90CaseAgeYears)} confidence={caseType.confidence} />
        <MetricCard title="Oldest Case Age" value={formatYears(caseType.oldestCaseAgeYears)} confidence={caseType.confidence} />
      </section>

      <CaveatBox title="What this means">
        {caseType.caveat}
      </CaveatBox>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black">Data confidence</h2>
          <ConfidenceBadge level={caseType.confidence} />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This page is generated from structured judgment metadata. Replace sample records with official/generated data before launch.
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { getCaseTypeBySlug, formatNumber, formatYears } from "@/lib/data";

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
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Case type</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">{caseType.caseType}</h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          Approximate case-age-to-judgment profile generated from structured judgment records.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <ConfidenceBadge level={caseType.confidence} />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{formatNumber(caseType.sampleSize)} records</span>
        </div>
      </section>

      {caseType.sample ? <SampleDataWarning /> : null}

      <MetricCard
        title="Median approximate case-age-to-judgment gap"
        value={formatYears(caseType.medianCaseAgeYears)}
        context={`Based on ${formatNumber(caseType.sampleSize)} judgment record${caseType.sampleSize === 1 ? "" : "s"}.`}
        confidence={caseType.confidence}
        sourceLabel={caseType.sources[0]?.name ?? "Generated data"}
        sourceHref={caseType.sources[0]?.url}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Distribution</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">How the records spread out</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard title="25th percentile" value={formatYears(caseType.p25CaseAgeYears)} confidence={caseType.confidence} />
          <MetricCard title="75th percentile" value={formatYears(caseType.p75CaseAgeYears)} confidence={caseType.confidence} />
          <MetricCard title="90th percentile" value={formatYears(caseType.p90CaseAgeYears)} confidence={caseType.confidence} />
          <MetricCard title="Oldest case-age gap" value={formatYears(caseType.oldestCaseAgeYears)} confidence={caseType.confidence} />
        </div>
      </section>

      <CaveatBox title="What this means">
        {caseType.caveat}
      </CaveatBox>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Judgments by year</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Decision-year coverage</h2>
          </div>
          <ConfidenceBadge level={caseType.confidence} />
        </div>
        <div className="mt-4 space-y-2">
          {caseType.judgmentsByYear.map((item) => (
            <div key={item.year} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-slate-800">{item.year}</span>
              <span className="text-slate-600">{formatNumber(item.count)} judgment record{item.count === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      </section>

      <Link href="/case-types" className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
        Back to case types
      </Link>
    </div>
  );
}

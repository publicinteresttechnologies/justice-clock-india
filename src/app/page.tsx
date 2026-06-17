import Link from "next/link";
import { DataCard } from "@/components/DataCard";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import {
  caseTypes,
  courtClock,
  dataMetadata,
  formatNumber,
  formatYears,
  judges,
  judgments,
} from "@/lib/data";

export default function HomePage() {
  const slowestCaseType = [...caseTypes].sort(
    (a, b) => (b.medianCaseAgeYears ?? 0) - (a.medianCaseAgeYears ?? 0),
  )[0];

  return (
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Justice Clock India</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
          How long does justice take at the Supreme Court of India?
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          A public tracker that turns court snapshots and judgment records into case-age, case-type, and public metadata profiles.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/data" className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
            See the data
          </Link>
          <Link href="/methodology" className="rounded-full border border-white/30 px-4 py-2 text-sm font-black text-white">
            Methodology
          </Link>
        </div>
      </section>

      {dataMetadata.sample ? <SampleDataWarning /> : null}

      <section className="grid gap-3">
        <MetricCard
          title="Supreme Court pending cases"
          value={formatNumber(courtClock.totalPending)}
          context={`Reporting period: ${courtClock.reportingPeriod}`}
          confidence={courtClock.confidence}
          sourceLabel={courtClock.sourceName}
          sourceHref={courtClock.sourceUrl}
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Instituted this month"
            value={formatNumber(courtClock.institutedThisMonth)}
            context="New matters entering the court-level snapshot."
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
          <MetricCard
            title="Disposed this month"
            value={formatNumber(courtClock.disposedThisMonth)}
            context={`Clearance rate: ${courtClock.clearanceRate ?? "—"}%`}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
        </section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current dataset</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">What the tracker can show</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-3xl font-black text-slate-950">{formatNumber(judgments.length)}</p>
            <p className="mt-1 text-sm text-slate-600">judgment records</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-3xl font-black text-slate-950">{formatNumber(caseTypes.length)}</p>
            <p className="mt-1 text-sm text-slate-600">case-type groups</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-3xl font-black text-slate-950">{formatNumber(judges.length)}</p>
            <p className="mt-1 text-sm text-slate-600">judge profiles</p>
          </div>
        </div>
      </section>

      {slowestCaseType ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Sample insight</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Longest case-age gap in current data</h2>
          <p className="mt-3 text-lg font-black text-slate-950">{slowestCaseType.caseType}</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Median approximate case-age-to-judgment gap: {formatYears(slowestCaseType.medianCaseAgeYears)}.
          </p>
          <Link
            href={`/case-types/${slowestCaseType.slug}`}
            className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            Open case type
          </Link>
        </section>
      ) : null}

      <section className="grid gap-3">
        <Link href="/case-types">
          <DataCard
            eyebrow={`${caseTypes.length} tracked types`}
            title="Case-Type Time to Justice"
            description="Compare approximate case-age-to-judgment timelines by case type."
          />
        </Link>

        <Link href="/judges">
          <DataCard
            eyebrow={`${judges.length} public profiles`}
            title="Public Judge Profiles"
            description="Judgment metadata profiles with attribution caveats, not performance ratings."
          />
        </Link>

        <Link href="/data">
          <DataCard
            eyebrow="Dataset"
            title="All data together"
            description="Open the bundled JSON, source files, judgment records, case-type metrics, and judge profiles."
          />
        </Link>
      </section>
    </div>
  );
}

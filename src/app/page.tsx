import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { courtClock, dataMetadata, formatNumber } from "@/lib/data";

function fieldContext(value: number | null | undefined, available: string, missing: string) {
  return value === null || value === undefined ? missing : available;
}

export default function HomePage() {
  const sourceMode = dataMetadata?.sources?.courtSnapshot?.mode ?? "unknown";
  const sourcePath = dataMetadata?.sources?.courtSnapshot?.path ?? "unknown";

  return (
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Supreme Court Justice Clock</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
          Daily public snapshot of Supreme Court pendency and disposal indicators.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          Source-linked court metrics with missing fields shown openly. No judge ranking, no court verdict, no invented numbers.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/data" className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
            Inspect source data
          </Link>
          <Link href="/methodology" className="rounded-full border border-white/30 px-4 py-2 text-sm font-black text-white">
            Methodology
          </Link>
        </div>
      </section>

      {dataMetadata.sample ? <SampleDataWarning /> : null}

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Source status</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{courtClock.sourceName}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Reporting period: <strong>{courtClock.reportingPeriod}</strong>. Captured at: <strong>{courtClock.capturedAt}</strong>.
          Data mode: <strong>{sourceMode}</strong>. Source file: <strong>{sourcePath}</strong>.
        </p>
        {courtClock.sourceUrl ? (
          <a href={courtClock.sourceUrl} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            Open source
          </a>
        ) : null}
      </section>

      <section className="grid gap-3">
        <MetricCard
          title="Total pending"
          value={formatNumber(courtClock.totalPending)}
          context={`Reporting period: ${courtClock.reportingPeriod}`}
          confidence={courtClock.confidence}
          sourceLabel={courtClock.sourceName}
          sourceHref={courtClock.sourceUrl}
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Civil pending"
            value={formatNumber(courtClock.civilPending)}
            context={fieldContext(courtClock.civilPending, "Civil pendency available from the source.", "Civil/criminal split is not available from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
          <MetricCard
            title="Criminal pending"
            value={formatNumber(courtClock.criminalPending)}
            context={fieldContext(courtClock.criminalPending, "Criminal pendency available from the source.", "Civil/criminal split is not available from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            title="Institution this month"
            value={formatNumber(courtClock.institutedThisMonth)}
            context={fieldContext(courtClock.institutedThisMonth, "Monthly institution figure available.", "Monthly institution figure is missing from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
          <MetricCard
            title="Disposal this month"
            value={formatNumber(courtClock.disposedThisMonth)}
            context={fieldContext(courtClock.disposedThisMonth, "Monthly disposal figure available.", "Monthly disposal figure is missing from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
          <MetricCard
            title="Clearance rate"
            value={courtClock.clearanceRate === null ? "—" : `${courtClock.clearanceRate}%`}
            context={courtClock.clearanceRate === null ? "Not calculated because institution/disposal figures are missing." : "Disposed ÷ instituted for the reporting period."}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            title="Cases older than 5 years"
            value={formatNumber(courtClock.casesOlderThan5Years)}
            context={fieldContext(courtClock.casesOlderThan5Years, "Old-case bucket available.", "5-year old-case bucket is missing from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
          <MetricCard
            title="Cases older than 10 years"
            value={formatNumber(courtClock.casesOlderThan10Years)}
            context={fieldContext(courtClock.casesOlderThan10Years, "Old-case bucket available.", "10-year old-case bucket is missing from the current source.")}
            confidence={courtClock.confidence}
            sourceLabel={courtClock.sourceName}
            sourceHref={courtClock.sourceUrl}
          />
        </section>
      </section>

      {courtClock.notes?.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Extraction notes</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {courtClock.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Product boundary</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Clock first. No scorecard.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          This build only displays Supreme Court pendency/disposal indicators from configured source data. Case-type pages and judge metadata remain secondary and must not be treated as rankings or findings.
        </p>
      </section>
    </div>
  );
}

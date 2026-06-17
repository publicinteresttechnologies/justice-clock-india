import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { caseTypes, formatNumber, formatYears } from "@/lib/data";

export default function CaseTypesPage() {
  const hasSampleData = caseTypes.some((caseType) => caseType.sample);
  const sortedCaseTypes = [...caseTypes].sort(
    (a, b) => (b.medianCaseAgeYears ?? 0) - (a.medianCaseAgeYears ?? 0),
  );
  const slowest = sortedCaseTypes[0];
  const totalRecords = caseTypes.reduce((sum, item) => sum + item.sampleSize, 0);

  return (
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Case types</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">Which kinds of cases take longest to reach judgment?</h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          Case-type metrics estimate the gap between case or diary year and judgment year. They are not predictions for a specific litigant.
        </p>
      </section>

      {hasSampleData ? <SampleDataWarning /> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tracked groups</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(caseTypes.length)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Judgment records</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(totalRecords)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Longest median gap</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{slowest ? formatYears(slowest.medianCaseAgeYears) : "—"}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Ranked by median case-age gap</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Current case-type table</h2>
        </div>

        <div className="grid gap-3">
          {sortedCaseTypes.map((caseType, index) => (
            <Link
              key={caseType.slug}
              href={`/case-types/${caseType.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-950">{caseType.caseType}</p>
                    <p className="mt-1 text-sm text-slate-600">Median approximate gap: {formatYears(caseType.medianCaseAgeYears)}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sample size: {formatNumber(caseType.sampleSize)}</p>
                  </div>
                </div>
                <ConfidenceBadge level={caseType.confidence} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

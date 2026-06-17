import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { formatNumber, formatYears, judges } from "@/lib/data";

export default function JudgesPage() {
  const hasSampleData = judges.some((item) => item.sample);
  const sortedProfiles = [...judges].sort(
    (a, b) => b.benchAssociatedJudgments - a.benchAssociatedJudgments,
  );
  const totalBenchRecords = judges.reduce((sum, item) => sum + item.benchAssociatedJudgments, 0);
  const totalAuthoredRecords = judges.reduce((sum, item) => sum + item.authoredJudgments, 0);

  return (
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Judges</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">Public judgment metadata profiles</h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          These profiles show authored and bench-associated judgment metadata. They are not rankings, performance scores, or blame metrics.
        </p>
      </section>

      {hasSampleData ? <SampleDataWarning /> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Profiles</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(judges.length)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bench records</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(totalBenchRecords)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Authored records</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(totalAuthoredRecords)}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Generated profiles</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Current judge table</h2>
        </div>

        <div className="grid gap-3">
          {sortedProfiles.map((profile) => (
            <Link
              key={profile.slug}
              href={`/judges/${profile.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{profile.judgeName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Authored: {formatNumber(profile.authoredJudgments)} · Bench records: {formatNumber(profile.benchAssociatedJudgments)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Median case-age gap: {formatYears(profile.medianCaseAgeYears)}
                  </p>
                </div>
                <ConfidenceBadge level={profile.confidence} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import {
  caseTypes,
  courtClock,
  dataMetadata,
  formatNumber,
  formatYears,
  judges,
  judgments,
} from "@/lib/data";

const publicFiles = [
  {
    title: "Bundled dataset",
    href: "/data/justice-clock-data.json",
    description: "Court clock, case-type metrics, judge profiles, and judgment records in one JSON file.",
  },
  {
    title: "Court clock",
    href: "/data/court-clock.json",
    description: "Snapshot-level court pendency and disposal figures.",
  },
  {
    title: "Case types",
    href: "/data/case-types.json",
    description: "Case-type-level approximate case-age-to-judgment metrics.",
  },
  {
    title: "Judges",
    href: "/data/judges.json",
    description: "Public metadata profiles for judges appearing in the judgment records.",
  },
];

export default function DataPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Data"
        title="All data together"
        description="A single place for the court clock snapshot, case-type metrics, judge metadata profiles, and underlying judgment records."
      />

      {dataMetadata.sample ? <SampleDataWarning /> : null}

      <CaveatBox title="Public-data caution">
        This page currently exposes the project structure and sample-data pipeline. It should not be presented as official Supreme Court data until the sample records are replaced with verified sources.
      </CaveatBox>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dataset bundle</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Justice Clock Data</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{dataMetadata.warning}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-1 font-bold text-slate-900">{dataMetadata.status}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Generated</p>
            <p className="mt-1 font-bold text-slate-900">{new Date(dataMetadata.generatedAt).toLocaleString("en-GB")}</p>
          </div>
        </div>
        <a
          href="/data/justice-clock-data.json"
          className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
        >
          Open bundled JSON
        </a>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <DataCard
          eyebrow="Court snapshot"
          title={formatNumber(courtClock.totalPending)}
          description="Total pending cases in the current court-clock snapshot."
        />
        <DataCard
          eyebrow="Judgment records"
          title={formatNumber(judgments.length)}
          description="Underlying judgment records currently in the dataset."
        />
        <DataCard
          eyebrow="Case types"
          title={formatNumber(caseTypes.length)}
          description="Case-type metric groups generated from judgment records."
        />
        <DataCard
          eyebrow="Judge profiles"
          title={formatNumber(judges.length)}
          description="Public judge metadata profiles generated from judgment records."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-950">Public JSON files</h2>
        <div className="grid gap-3">
          {publicFiles.map((file) => (
            <a
              key={file.href}
              href={file.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <p className="font-black text-slate-950">{file.title}</p>
              <p className="mt-1 text-sm text-slate-600">{file.description}</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-400">{file.href}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-950">Case-type metrics</h2>
        <div className="space-y-3">
          {caseTypes.map((caseType) => (
            <Link
              key={caseType.slug}
              href={`/case-types/${caseType.slug}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{caseType.caseType}</p>
                  <p className="mt-1 text-sm text-slate-600">Sample size: {formatNumber(caseType.sampleSize)}</p>
                </div>
                <ConfidenceBadge level={caseType.confidence} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Median case-age-to-judgment gap: {formatYears(caseType.medianCaseAgeYears)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-950">Judge metadata profiles</h2>
        <div className="space-y-3">
          {judges.map((judge) => (
            <Link
              key={judge.slug}
              href={`/judges/${judge.slug}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{judge.judgeName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Authored: {formatNumber(judge.authoredJudgments)} · Bench records: {formatNumber(judge.benchAssociatedJudgments)}
                  </p>
                </div>
                <ConfidenceBadge level={judge.confidence} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Median case-age gap: {formatYears(judge.medianCaseAgeYears)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-950">Judgment records</h2>
        <div className="space-y-3">
          {judgments.map((judgment) => (
            <article key={judgment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{judgment.caseTitle}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{judgment.caseNumber}</p>
                </div>
                <ConfidenceBadge level={judgment.confidence} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-bold">Case type:</span> {judgment.caseType}</p>
                <p><span className="font-bold">Judgment date:</span> {judgment.judgmentDate}</p>
                <p><span className="font-bold">Diary year:</span> {judgment.diaryYear ?? "—"}</p>
                <p><span className="font-bold">Bench size:</span> {judgment.benchSize}</p>
                <p className="sm:col-span-2"><span className="font-bold">Bench:</span> {judgment.judges.join(", ")}</p>
                <p className="sm:col-span-2"><span className="font-bold">Author:</span> {judgment.authoringJudge ?? "Not recorded"}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

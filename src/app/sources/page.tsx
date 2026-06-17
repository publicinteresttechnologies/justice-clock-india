import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { SectionHeader } from "@/components/SectionHeader";

const sourcePlan = [
  {
    name: "Supreme Court NJDG / SCDG / court clock sources",
    proves: "Court-level pendency, civil/criminal split, institution, disposal, clearance movement, and old-case movement where published.",
    limitation: "Does not by itself create a clean judge-wise performance table and should not be used for individual blame.",
    confidence: "High for aggregate metrics once connected",
  },
  {
    name: "Supreme Court judgment metadata",
    proves: "Judgment dates, case identifiers, case type, bench composition, authoring judge where available, and subject metadata where parsed.",
    limitation: "Does not always provide exact filing-to-disposal lifecycle data in clean bulk form.",
    confidence: "Medium-high for judgment analytics once parsed",
  },
  {
    name: "Generated case-type metrics",
    proves: "Approximate case-age-to-judgment gaps grouped by case type from judgment records.",
    limitation: "Approximates age using case or diary year when exact filing date is unavailable.",
    confidence: "Medium to experimental depending on source completeness",
  },
  {
    name: "Generated judge metadata profiles",
    proves: "Public authored and bench-associated judgment metadata, subject mix, and case-type mix.",
    limitation: "Not a ranking, not a finding of delay responsibility, and not a measure of judicial quality.",
    confidence: "Experimental until source coverage is validated",
  },
];

export default function SourcesPage() {
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Sources"
        title="Where the numbers come from"
        description="The product separates official aggregate sources, judgment metadata, and generated metrics. Each layer has a different confidence level."
      />

      <CaveatBox title="Current status">
        The live scaffold still uses sample data. This page describes the source architecture that must be connected before public launch.
      </CaveatBox>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Public files</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Open data outputs</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The app exposes generated JSON files so the public can inspect the data behind the interface.
        </p>
        <Link href="/data" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
          Open data hub
        </Link>
      </section>

      <div className="grid gap-3">
        {sourcePlan.map((source) => (
          <section key={source.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">{source.confidence}</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">{source.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <strong>What it proves:</strong> {source.proves}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <strong>What it does not prove:</strong> {source.limitation}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

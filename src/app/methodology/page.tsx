import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { SectionHeader } from "@/components/SectionHeader";

const attributionLevels = [
  {
    title: "Direct",
    text: "Mostly attributable to a judge or record field, such as an authored judgment where the author is explicitly recorded.",
  },
  {
    title: "Bench-associated",
    text: "Associated with a bench including a judge, but not assigned as individual responsibility. Most judge-page metrics start here.",
  },
  {
    title: "System-associated",
    text: "Linked to court process, listing, registry, roster, or aggregate case flow rather than to a named judge.",
  },
  {
    title: "Experimental",
    text: "Derived from incomplete metadata, approximations, or early parsing. These metrics must carry visible caveats.",
  },
];

const confidenceLevels = [
  "high: official aggregate source with stable meaning",
  "medium-high: official or court-origin metadata with some gaps",
  "medium: useful but incomplete source structure",
  "experimental: sample, inferred, or prototype-only data",
];

export default function MethodologyPage() {
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Methodology"
        title="What we measure, and what we refuse to pretend"
        description="Justice Clock India separates court-level flow, case-type delay, and public judgment metadata so users can see what is measured, what is approximate, and what should not be inferred."
      />

      <CaveatBox title="Core rule">
        A delay metric is not automatically a blame metric. Many case-flow outcomes are shaped by listing, registry process, roster, counsel behaviour, case complexity, state capacity, and bench composition.
      </CaveatBox>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Formula</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Approximate case-age-to-judgment gap</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Where exact filing-to-disposal dates are unavailable, the app estimates time to justice using the gap between the judgment year and the case year or diary year.
        </p>
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 font-mono text-sm text-white">
          judgment year − case/diary year = approximate case-age gap
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Attribution</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Four levels of responsibility</h2>
        </div>
        <div className="grid gap-3">
          {attributionLevels.map((level) => (
            <section key={level.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-black text-slate-950">{level.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{level.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Confidence</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Confidence labels</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          {confidenceLevels.map((level) => (
            <li key={level} className="rounded-2xl bg-slate-50 px-4 py-3">{level}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Launch guardrails</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">What the product will not do at launch</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          <li>It will not rank judges as best or worst.</li>
          <li>It will not label judges as slow, corrupt, anti-citizen, or pro-government.</li>
          <li>It will not treat bench-associated delay as individual fault.</li>
          <li>It will not present sample or inferred records as official court data.</li>
        </ul>
      </section>

      <Link href="/launch-checklist" className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
        Open launch checklist
      </Link>
    </div>
  );
}

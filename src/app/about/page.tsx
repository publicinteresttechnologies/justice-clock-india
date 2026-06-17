import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";

export default function AboutPage() {
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="About"
        title="Justice delayed, measured carefully"
        description="Justice Clock India is an independent public-interest data project for making Supreme Court case-flow information easier to understand."
      />

      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Purpose</p>
        <h2 className="mt-4 text-3xl font-black leading-tight">The point is not outrage. The point is visibility.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          Court delay is usually discussed as anecdote, grievance, or political noise. This project turns public records into a readable clock: what is pending, what is moving, what case types take longer, and what metadata can be responsibly shown.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Independence</h2>
        <p className="text-sm leading-6 text-slate-700">
          Justice Clock India is not an official Supreme Court website and does not provide legal advice. It is a public data interface built from available records and clearly labelled generated metrics.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Judge pages are not ratings</h2>
        <p className="text-sm leading-6 text-slate-700">
          Judge pages are public metadata profiles, not performance ratings. Case-age metrics are bench-associated unless explicitly marked as authored or direct.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Approximation policy</h2>
        <p className="text-sm leading-6 text-slate-700">
          Where exact filing-to-disposal dates are unavailable, time-to-justice metrics use case year or diary year as an approximation. These figures are useful for public transparency, not for predicting a specific case.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/methodology" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
          Read methodology
        </Link>
        <Link href="/data" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800">
          See data
        </Link>
      </div>
    </div>
  );
}

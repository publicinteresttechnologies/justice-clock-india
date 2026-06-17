export default function MethodologyPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Methodology
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          What we measure, and what we do not
        </h1>
      </header>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Core metric</h2>
        <p className="text-sm leading-6 text-slate-700">
          Justice Clock India measures court-level pendency, case-type delay,
          and public judgment metadata. Where exact filing-to-disposal dates are
          unavailable, the product uses case year or diary year as an
          approximation.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Why we do not rank judges yet</h2>
        <p className="text-sm leading-6 text-slate-700">
          Judge pages are not performance ratings. Many case-flow metrics are
          bench-associated or system-associated, not directly attributable to a
          single judge.
        </p>
      </section>
    </div>
  );
}

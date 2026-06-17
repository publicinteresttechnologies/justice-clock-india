export default function AboutPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          About
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Justice delayed, measured daily
        </h1>
      </header>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-slate-700">
          Justice Clock India is an independent public data project. It is not
          an official Supreme Court website and does not provide legal advice.
        </p>
        <p className="text-sm leading-6 text-slate-700">
          Judge pages are public metadata profiles, not performance ratings.
          Case-age metrics are bench-associated unless explicitly marked as
          authored or direct.
        </p>
        <p className="text-sm leading-6 text-slate-700">
          Where exact filing-to-disposal dates are unavailable, time-to-justice
          metrics use case year or diary year as an approximation.
        </p>
      </section>
    </div>
  );
}

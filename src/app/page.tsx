import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Justice Clock India
        </p>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">
          How long does justice take?
        </h1>
        <p className="text-base leading-7 text-slate-700">
          A mobile-first public data tracker for Supreme Court pendency,
          case-type delay, and public judgment profiles.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          Supreme Court Pending Cases
        </p>
        <p className="mt-2 text-5xl font-black tracking-tight">Sample</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sample data mode. Replace with official/generated data before public
          launch.
        </p>
      </section>

      <section className="grid gap-3">
        <Link
          href="/case-types"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-bold">Case-Type Time to Justice</p>
          <p className="mt-1 text-sm text-slate-600">
            See approximate case-age-to-judgment timelines by case type.
          </p>
        </Link>

        <Link
          href="/judges"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-bold">Public Judge Profiles</p>
          <p className="mt-1 text-sm text-slate-600">
            Judgment metadata profiles, not performance ratings.
          </p>
        </Link>

        <Link
          href="/methodology"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-bold">Methodology</p>
          <p className="mt-1 text-sm text-slate-600">
            How metrics, confidence labels, and caveats work.
          </p>
        </Link>
      </section>
    </div>
  );
}

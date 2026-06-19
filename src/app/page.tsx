import { courtClock, dataMetadata, formatNumber } from "@/lib/data";

function formatDateTime(value?: string) {
  if (!value) return "Missing";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function valueStatus(value: number | null | undefined) {
  return value === null || value === undefined ? "Missing from current source" : formatNumber(value);
}

export default function HomePage() {
  const sourceMode = dataMetadata?.sources?.courtSnapshot?.mode ?? "unknown";
  const sourcePath = dataMetadata?.sources?.courtSnapshot?.path ?? "unknown";
  const missingFields = [
    ["Civil pending", courtClock.civilPending],
    ["Criminal pending", courtClock.criminalPending],
    ["Instituted this month", courtClock.institutedThisMonth],
    ["Disposed this month", courtClock.disposedThisMonth],
    ["Clearance rate", courtClock.clearanceRate],
  ].filter(([, value]) => value === null || value === undefined);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 text-slate-950">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Justice Clock India</p>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          How backed up is the Supreme Court of India right now?
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          A source-linked public snapshot of Supreme Court pendency. Missing fields are shown as missing, not estimated.
        </p>

        <div className="mt-8 rounded-[1.75rem] bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Total pending cases</p>
          <p className="mt-4 text-6xl font-black tracking-tight sm:text-7xl">{formatNumber(courtClock.totalPending)}</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Reporting period: <strong className="text-white">{courtClock.reportingPeriod}</strong>
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Source</p>
            <p className="mt-2 text-base font-black">{courtClock.sourceName}</p>
            {courtClock.sourceUrl ? (
              <a className="mt-3 inline-block text-sm font-bold underline" href={courtClock.sourceUrl}>
                Open source link
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Source link missing.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Capture</p>
            <p className="mt-2 text-base font-black">{formatDateTime(courtClock.capturedAt)}</p>
            <p className="mt-3 text-sm text-slate-600">Confidence: <strong>{courtClock.confidence}</strong></p>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Missing fields</p>
          {missingFields.length ? (
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              {missingFields.map(([label]) => (
                <li key={String(label)}>• {label}: missing from current source</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-700">No configured court-clock fields are missing.</p>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Available fields</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold">Civil pending</dt>
              <dd className="text-slate-700">{valueStatus(courtClock.civilPending)}</dd>
            </div>
            <div>
              <dt className="font-bold">Criminal pending</dt>
              <dd className="text-slate-700">{valueStatus(courtClock.criminalPending)}</dd>
            </div>
            <div>
              <dt className="font-bold">Institution this month</dt>
              <dd className="text-slate-700">{valueStatus(courtClock.institutedThisMonth)}</dd>
            </div>
            <div>
              <dt className="font-bold">Disposal this month</dt>
              <dd className="text-slate-700">{valueStatus(courtClock.disposedThisMonth)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Methodology</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            This page displays the configured Supreme Court court-clock snapshot from the existing data pipeline. It does not estimate missing values. The current snapshot uses <strong>{sourceMode}</strong> mode from <strong>{sourcePath}</strong>.
          </p>
          {courtClock.notes?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
              {courtClock.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <footer className="mt-6 text-xs leading-5 text-slate-500">
          No judge rankings. No predictions. No claim of completeness beyond the fields shown on this page.
        </footer>
      </section>
    </main>
  );
}

const sources = [
  {
    name: "Supreme Court NJDG / SCDG",
    proves: "Court-level pendency, institution, disposal, and aggregate movement.",
    limitation: "Does not by itself provide a clean judge-wise disposal table.",
    confidence: "High for aggregate metrics",
  },
  {
    name: "Supreme Court judgments metadata",
    proves: "Judgment dates, case identifiers, benches, and judgment records where available.",
    limitation: "Does not always provide the full case lifecycle in clean bulk form.",
    confidence: "Medium-high for judgment analytics",
  },
];

export default function SourcesPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Data
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Sources and confidence
        </h1>
      </header>

      <div className="grid gap-3">
        {sources.map((source) => (
          <section
            key={source.name}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-black">{source.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <strong>What it proves:</strong> {source.proves}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <strong>What it does not prove:</strong> {source.limitation}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-amber-700">
              {source.confidence}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

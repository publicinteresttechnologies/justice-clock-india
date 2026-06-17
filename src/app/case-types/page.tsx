import Link from "next/link";

const sampleCaseTypes = [
  "SLP Civil",
  "SLP Criminal",
  "Criminal Appeal",
  "Civil Appeal",
  "Writ Petition",
];

export default function CaseTypesPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Case Types
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Time to Justice by Case Type
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Approximate case-age-to-judgment timelines. Sample layout only.
        </p>
      </header>

      <div className="grid gap-3">
        {sampleCaseTypes.map((caseType) => {
          const slug = caseType.toLowerCase().replaceAll(" ", "-");

          return (
            <Link
              key={caseType}
              href={`/case-types/${slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-bold">{caseType}</p>
              <p className="mt-1 text-sm text-slate-600">
                Median delay: Sample
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-700">
                Confidence: Sample
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

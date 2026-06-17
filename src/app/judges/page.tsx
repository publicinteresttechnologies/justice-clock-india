import Link from "next/link";

const sampleJudges = ["Sample Judge A", "Sample Judge B", "Sample Judge C"];

export default function JudgesPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Judges
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Public Judgment Profiles
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Metadata profiles only. These are not performance ratings.
        </p>
      </header>

      <div className="grid gap-3">
        {sampleJudges.map((judge) => {
          const slug = judge.toLowerCase().replaceAll(" ", "-");

          return (
            <Link
              key={judge}
              href={`/judges/${slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-bold">{judge}</p>
              <p className="mt-1 text-sm text-slate-600">
                Authored judgments: Sample
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-700">
                Not a performance rating
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

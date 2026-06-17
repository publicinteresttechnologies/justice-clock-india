import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYears, judges } from "@/lib/data";

export default function JudgesPage() {
  const hasSampleData = judges.some((item) => item.sample);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Judges"
        title="Public Judgment Profiles"
        description="Metadata profiles generated from judgment records."
      />

      {hasSampleData ? <SampleDataWarning /> : null}

      <div className="grid gap-3">
        {judges.map((item) => (
          <Link
            key={item.slug}
            href={`/judges/${item.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{item.judgeName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Authored: {item.authoredJudgments} · Bench records: {item.benchAssociatedJudgments}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Median case-age gap: {formatYears(item.medianCaseAgeYears)}
                </p>
              </div>
              <ConfidenceBadge level={item.confidence} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

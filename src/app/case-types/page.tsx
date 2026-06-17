import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { caseTypes, formatYears } from "@/lib/data";

export default function CaseTypesPage() {
  const hasSampleData = caseTypes.some((caseType) => caseType.sample);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Case Types"
        title="Time to Justice by Case Type"
        description="Approximate case-age-to-judgment timelines from generated judgment metadata."
      />

      {hasSampleData ? <SampleDataWarning /> : null}

      <div className="grid gap-3">
        {caseTypes.map((caseType) => (
          <Link
            key={caseType.slug}
            href={`/case-types/${caseType.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{caseType.caseType}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Median gap: {formatYears(caseType.medianCaseAgeYears)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sample size: {caseType.sampleSize}
                </p>
              </div>
              <ConfidenceBadge level={caseType.confidence} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

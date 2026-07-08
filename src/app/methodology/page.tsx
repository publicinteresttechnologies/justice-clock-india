import Link from "next/link";
import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="How Justice Clock India turns repeatable public records into readable public-interest metrics."
        title="Methodology"
      />

      <DataCard title="What Justice Clock India Measures">
        <p className="text-sm leading-6 text-slate-700">
          Justice Clock India measures visible court-system movement: pendency,
          institution, disposal, case-type judgment samples, and public judgment
          metadata profiles.
        </p>
      </DataCard>

      <DataCard title="What It Does Not Measure">
        <p className="text-sm leading-6 text-slate-700">
          It does not measure the merits of a case, predict the outcome or timing
          of any individual matter, provide legal advice, or assign personal
          responsibility for delay.
        </p>
      </DataCard>

      <DataCard title="Clearance Rate">
        <p className="text-sm leading-6 text-slate-700">
          Clearance rate is calculated as disposed cases divided by instituted
          cases for the same reporting period, multiplied by 100.
        </p>
      </DataCard>

      <DataCard title="Approximate Case-age-to-judgment">
        <p className="text-sm leading-6 text-slate-700">
          When exact filing dates are available, date-based age can be used.
          Where exact filing-to-disposal dates are unavailable, Justice Clock
          India uses case year or diary year as an approximation and compares it
          with decision year or judgment year.
        </p>
      </DataCard>

      <DataCard title="Why This Is Not Exact Filing-to-disposal">
        <p className="text-sm leading-6 text-slate-700">
          Case year and diary year are coarse public metadata fields. They can
          indicate an approximate starting year, but they do not always prove the
          exact filing date, listing history, transfer history, or full procedural
          path of a matter.
        </p>
      </DataCard>

      <DataCard title="Judge Pages Are Metadata Profiles">
        <p className="text-sm leading-6 text-slate-700">
          Judge pages summarize public metadata connected to judgment records.
          Bench-associated counts are not individual performance scores and do
          not assign responsibility for delay, outcome, or administrative
          listing.
        </p>
      </DataCard>

      <DataCard title="Why We Use Metadata Profiles">
        <p className="text-sm leading-6 text-slate-700">
          Comparative performance lists would require stronger attribution,
          fuller procedural context, validated official data, and safeguards
          against misleading comparisons. This project starts with transparent
          public judgment metadata profiles.
        </p>
      </DataCard>

      <DataCard title="Update Frequency">
        <p className="text-sm leading-6 text-slate-700">
          The data pipeline is designed to run on demand and on a scheduled
          refresh. Public outputs are regenerated from validated import files or
          clearly marked sample fallback files.
        </p>
      </DataCard>

      <DataCard title="Confidence Labels">
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>High: official source, stable schema, repeatable capture.</p>
          <p>Medium-high: strong public source with minor limitations.</p>
          <p>Medium: useful but incomplete or partially inferred.</p>
          <p>Low: thin sample or significant missing context.</p>
          <p>Experimental: sample, prototype, or unverified generated output.</p>
        </div>
      </DataCard>

      <DataCard title="Attribution Labels">
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>Direct: explicitly authored or directly attributed in the record.</p>
          <p>Bench-associated: the judge appears on the bench for the record.</p>
          <p>System-associated: connected to court-system metadata.</p>
          <p>Experimental: prototype attribution requiring review.</p>
        </div>
      </DataCard>

      <DataCard title="Public Launch Readiness">
        <Link className="text-sm font-semibold text-amber-900" href="/launch-checklist">
          Open launch checklist
        </Link>
      </DataCard>
    </div>
  );
}

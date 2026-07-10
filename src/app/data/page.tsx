import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { DataCard } from "@/components/DataCard";
import { JudgmentExplorer } from "@/components/JudgmentExplorer";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { dataMetadata } from "@/lib/data";
import { formatNumber } from "@/lib/format";

function sourceLabel(mode: "import" | "sample") {
  return mode === "import" ? "Import" : "Sample";
}

export default function DataPage() {
  const courtIsSample = dataMetadata.sources.courtSnapshot.mode === "sample";
  const judgmentsAreSample = dataMetadata.sources.judgments.mode === "sample";

  return (
    <div className="space-y-6">
      <SectionHeader
        description="Current generated metrics, source status, and public JSON files."
        title="Data"
      />

      {(courtIsSample || judgmentsAreSample) ? <SampleDataWarning /> : null}

      {!dataMetadata.publicLaunchReady ? (
        <CaveatBox>
          This build is not public-launch ready because one or more data sources
          are still sample-mode.
        </CaveatBox>
      ) : null}

      <DataCard title="Current Source Status">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Court snapshot source
            </p>
            <p className="text-lg font-semibold capitalize text-slate-950">
              {sourceLabel(dataMetadata.sources.courtSnapshot.mode)}
            </p>
            <p className="text-sm text-slate-600">
              {dataMetadata.sources.courtSnapshot.path}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">
              Judgment records source
            </p>
            <p className="text-lg font-semibold capitalize text-slate-950">
              {sourceLabel(dataMetadata.sources.judgments.mode)}
            </p>
            <p className="text-sm text-slate-600">
              {dataMetadata.sources.judgments.path}
            </p>
          </div>
        </div>
      </DataCard>

      <DataCard title="Scope">
        <p className="text-sm leading-6 text-slate-700">
          This build is scoped to Supreme Court of India court snapshot data and
          Supreme Court judgment metadata only.
        </p>
      </DataCard>

      {dataMetadata.datasetScope ? (
        <DataCard title="Dataset Scope">
          <div className="space-y-2 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-950">
              {dataMetadata.datasetScope.name}
            </p>
            <p>Court: {dataMetadata.datasetScope.court}</p>
            <p>Coverage: {dataMetadata.datasetScope.coverage}</p>
            <p>Years: {dataMetadata.datasetScope.years}</p>
            <p>
              Full Supreme Court coverage:{" "}
              {dataMetadata.datasetScope.fullCourtCoverage ? "Yes" : "No"}
            </p>
          </div>
        </DataCard>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Judgment records"
          value={formatNumber(dataMetadata.counts.judgmentRecords)}
        />
        <MetricCard label="Case types" value={dataMetadata.counts.caseTypes} />
        <MetricCard
          label="Judge profiles"
          value={dataMetadata.counts.judgeProfiles}
        />
        <MetricCard
          label="Sample mode"
          tone={dataMetadata.sample ? "danger" : "positive"}
          value={dataMetadata.sample ? "On" : "Off"}
        />
        <MetricCard
          label="Public launch"
          tone={dataMetadata.publicLaunchReady ? "positive" : "warning"}
          value={dataMetadata.publicLaunchReady ? "Yes" : "No"}
        />
      </div>

      <DataCard title="Public JSON Bundle">
        <div className="space-y-2 text-sm font-semibold text-amber-900">
          {Object.entries(dataMetadata.files).map(([label, href]) => (
            <a className="block" href={href} key={label}>
              {label}: {href}
            </a>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Generated {new Date(dataMetadata.generatedAt).toLocaleString("en-IN")}.
        </p>
      </DataCard>

      <section className="space-y-3">
        <SectionHeader
          description="Search case title, judge name, or case type and filter by bench size or year."
          title="Judgment Records"
        />
        <JudgmentExplorer />
      </section>

      <CaveatBox>
        Generated metrics use conservative language: approximate
        case-age-to-judgment gap, bench-associated metrics, public judgment
        metadata profiles, and source confidence.
      </CaveatBox>

      <DataCard title="Launch Readiness">
        <Link className="text-sm font-semibold text-amber-900" href="/launch-checklist">
          Open launch checklist
        </Link>
      </DataCard>
    </div>
  );
}

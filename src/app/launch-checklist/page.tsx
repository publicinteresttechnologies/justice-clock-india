import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";
import { dataMetadata } from "@/lib/data";

export default function LaunchChecklistPage() {
  const checks = [
    {
      label: "Supreme Court-only scope confirmed",
      complete: true,
    },
    {
      label: "Real data connected",
      complete:
        dataMetadata.sources.courtSnapshot.mode === "import" &&
        dataMetadata.sources.judgments.mode === "import",
    },
    {
      label: "Real court snapshot connected",
      complete: dataMetadata.sources.courtSnapshot.mode === "import",
    },
    {
      label: "Real judgment records connected",
      complete: dataMetadata.sources.judgments.mode === "import",
    },
    {
      label: "Sample mode off",
      complete: !dataMetadata.sample,
    },
    {
      label: "Judgment records available",
      complete: dataMetadata.counts.judgmentRecords > 0,
    },
    {
      label: "Public JSON bundle generated",
      complete: Boolean(dataMetadata.files.bundledDataset),
    },
    {
      label: "NJDG latest snapshot JSON generated",
      complete: Boolean(dataMetadata.files.njdgLatest),
    },
    {
      label: "Judgment corpus summary generated",
      complete: Boolean(dataMetadata.files.judgmentCorpusSummary),
    },
    {
      label: "Delay summary generated",
      complete: Boolean(dataMetadata.files.delaySummary),
    },
    {
      label: "Research index generated",
      complete: Boolean(dataMetadata.files.researchIndex),
    },
    {
      label: "Judgment JSON generated",
      complete: Boolean(dataMetadata.files.judgments),
    },
    {
      label: "Source metadata available",
      complete: Boolean(
        dataMetadata.sources.courtSnapshot.path &&
          dataMetadata.sources.judgments.path,
      ),
    },
    {
      label: "Subject-specific dataset labelled",
      complete:
        !dataMetadata.datasetScope ||
        dataMetadata.datasetScope.fullCourtCoverage === false,
    },
    {
      label: "Full Supreme Court coverage not claimed",
      complete:
        !dataMetadata.datasetScope ||
        dataMetadata.datasetScope.fullCourtCoverage === false,
    },
    {
      label: "Judge profile caveat visible",
      complete: true,
    },
    {
      label: "Methodology page available",
      complete: true,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        description="A simple pre-launch checklist computed from generated dataset metadata where possible. The product scope is Supreme Court of India data only."
        title="Launch Checklist"
      />

      <div className="space-y-3">
          {checks.map((check) => (
            <DataCard key={check.label} title={check.label}>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  check.complete
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-amber-100 text-amber-950"
                }`}
              >
                {check.complete ? "Complete" : "Missing"}
              </span>
            </DataCard>
          ))}
      </div>
    </div>
  );
}

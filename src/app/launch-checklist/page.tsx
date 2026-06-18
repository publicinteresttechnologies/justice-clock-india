import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { SectionHeader } from "@/components/SectionHeader";
import { dataMetadata, formatNumber, judgments } from "@/lib/data";

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${complete ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
      {complete ? "Complete" : "Missing"}
    </span>
  );
}

export default function LaunchChecklistPage() {
  const sourceModes = dataMetadata.sources ?? {};
  const counts = dataMetadata.counts ?? { judgmentRecords: judgments.length, caseTypes: 0, judgeProfiles: 0 };
  const files = dataMetadata.files ?? {};
  const ready = Boolean(dataMetadata.publicLaunchReady);

  const checklist = [
    ["Supreme Court-only scope confirmed", dataMetadata.scope?.court === "Supreme Court of India", "The current product scope is limited to the Supreme Court of India."],
    ["Real court snapshot connected", sourceModes.courtSnapshot?.mode === "import", "Requires data/imports/court-snapshot.json."],
    ["Real judgment records connected", sourceModes.judgments?.mode === "import", "Requires data/imports/judgments.csv or data/imports/judgments.json."],
    ["Sample mode off", dataMetadata.sample === false, "Sample mode must be false before launch."],
    ["Judgment records available", counts.judgmentRecords > 0, `${formatNumber(counts.judgmentRecords)} records currently available.`],
    ["Public JSON bundle generated", Boolean(files.bundledDataset), files.bundledDataset ?? "Missing bundled dataset path."],
    ["Judgment JSON generated", Boolean(files.judgments), files.judgments ?? "Missing judgment JSON path."],
    ["Source metadata available", Boolean(sourceModes.courtSnapshot && sourceModes.judgments), "Bundled metadata identifies source mode and path."],
    ["Methodology page available", true, "The methodology page explains approximation and attribution limits."],
  ] as const;

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Launch checklist"
        title="Is Justice Clock India ready to publish?"
        description="A Supreme Court-only readiness checklist for source status, sample mode, public JSON files, and methodology visibility."
      />

      {!ready ? (
        <CaveatBox title="Current verdict">
          This build is not public-launch ready yet. One or more Supreme Court data sources are still sample-mode or missing.
        </CaveatBox>
      ) : null}

      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Readiness</p>
        <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight">{ready ? "Ready for public launch" : "Not ready for public launch"}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-200">Public launch requires imported Supreme Court data, sample mode off, generated public JSON outputs, and visible methodology caveats.</p>
      </section>

      <div className="grid gap-3">
        {checklist.map(([label, complete, detail]) => (
          <section key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">{label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
              <StatusPill complete={Boolean(complete)} />
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/data" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">Open data hub</Link>
        <Link href="/methodology" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800">Read methodology</Link>
      </div>
    </div>
  );
}

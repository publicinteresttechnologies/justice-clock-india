import Link from "next/link";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataHealthPanel } from "@/components/DataHealthPanel";
import { DataCard } from "@/components/DataCard";
import { KeyValueList } from "@/components/KeyValueList";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import {
  caseTypes,
  courtClock,
  dataMetadata,
  judges,
  siteSummary,
} from "@/lib/data";
import { formatNumber, formatPercent, formatYears, sortedEntries } from "@/lib/format";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Justice Clock India
          </h1>
          <p className="text-base font-medium text-slate-700">
            Supreme Court delay, output, and backlog signals
          </p>
        </div>
        <p className="text-2xl font-semibold leading-8 text-slate-950">
          Public-source Supreme Court records, measured carefully.
        </p>
        <p className="text-base leading-7 text-slate-700">
          Justice Clock India tracks Supreme Court delay, output, and backlog
          signals using public court records and transparent source snapshots.
        </p>
      </section>

      <MetricCard
        helper={courtClock.reportingPeriod}
        label="Latest NJDG Snapshot"
        tone="warning"
        value={formatNumber(courtClock.totalPending)}
      />

      <DataCard title="Monthly Movement">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Instituted"
            value={formatNumber(courtClock.institutedThisMonth)}
          />
          <MetricCard
            helper={`${formatNumber(courtClock.oldCasesDisposedThisMonth)} old cases disposed`}
            label="Disposed"
            tone="positive"
            value={formatNumber(courtClock.disposedThisMonth)}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Clearance rate: {formatPercent(courtClock.clearanceRate)}. Missing
          fields are shown as missing, not estimated.
        </p>
      </DataCard>

      <DataCard title="Justice Clock Movement">
        <SimpleBarChart
          data={[
            {
              label: "Instituted this month",
              value: courtClock.institutedThisMonth,
            },
            {
              label: "Disposed this month",
              value: courtClock.disposedThisMonth,
            },
            {
              label: "Old cases disposed",
              value: courtClock.oldCasesDisposedThisMonth,
            },
          ]}
          valueLabel={formatNumber}
        />
      </DataCard>

      <section className="space-y-3">
        <SectionHeader title="Civil / Criminal Split" />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Civil" value={formatNumber(courtClock.civilPending)} />
          <MetricCard
            label="Criminal"
            value={formatNumber(courtClock.criminalPending)}
          />
        </div>
      </section>

      <DataCard title="Civil / Criminal Chart">
        <SimpleBarChart
          data={[
            { label: "Civil pending", value: courtClock.civilPending },
            { label: "Criminal pending", value: courtClock.criminalPending },
          ]}
          valueLabel={formatNumber}
        />
      </DataCard>

      <DataCard title="Pending by Bench Size">
        <KeyValueList items={courtClock.coramPending} />
      </DataCard>

      <DataCard title="Pending Distribution">
        <SimpleBarChart
          data={courtClock.coramPending.map((item) => ({
            label: item.benchSize,
            value: item.pending,
          }))}
          valueLabel={formatNumber}
        />
      </DataCard>

      {courtClock.isSampleData ? <SampleDataWarning /> : null}

      <DataHealthPanel summary={siteSummary} />

      <CaveatBox>
        This is not an official court service. Live figures are captured from
        public dashboards and may change between snapshots. Historical delay
        figures are estimates unless exact filing or registration dates are
        available.
      </CaveatBox>

      <section className="space-y-3">
        <SectionHeader
          description="Separate status cards for the backlog snapshot, judgment corpus, delay estimator, and research layer."
          title="Product Layers"
        />
        <div className="grid gap-3">
          <DataCard
            href="/data"
            subtitle={dataMetadata.sources.courtSnapshot.path}
            title="Current backlog snapshot"
          >
            <p className="text-sm leading-6 text-slate-700">
              Status: {dataMetadata.sources.courtSnapshot.mode}.
            </p>
          </DataCard>
          <DataCard
            href="/data"
            subtitle={`${formatNumber(dataMetadata.counts.judgmentRecords)} records`}
            title="Judgment metadata corpus"
          >
            <p className="text-sm leading-6 text-slate-700">
              Public judgment metadata used for generated metrics.
            </p>
          </DataCard>
          <DataCard href="/methodology" title="Historical delay estimator">
            <p className="text-sm leading-6 text-slate-700">
              Historical estimated time-to-judgment from available start-year
              signals.
            </p>
          </DataCard>
          <DataCard href="/research" title="Latest research">
            <p className="text-sm leading-6 text-slate-700">
              Draft research posts and methodology notes. No unsupported
              headline numbers are published.
            </p>
          </DataCard>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          description="Early preview cards from generated metrics."
          title="Case Types"
        />
        <div className="space-y-3">
          {caseTypes.slice(0, 3).map((item) => (
            <DataCard
              href={`/case-types/${item.slug}`}
              key={item.slug}
              subtitle={`${item.sampleSize} judgment records`}
              title={item.caseType}
            >
              <p className="text-sm text-slate-600">Median approximate gap</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {formatYears(item.medianCaseAgeYears)}
              </p>
              <div className="mt-3">
                <ConfidenceBadge level={item.confidence} />
              </div>
            </DataCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          description="Search and filters are available on the full judges page."
          title="Judge Profiles"
        />
        <div className="space-y-3">
          {judges.slice(0, 3).map((judge) => (
            <DataCard
              href={`/judges/${judge.slug}`}
              key={judge.slug}
              subtitle={sortedEntries(judge.caseTypeMix)[0]?.[0]}
              title={judge.judgeName}
            >
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Authored"
                  value={judge.authoredJudgments}
                />
                <MetricCard
                  label="Bench-associated"
                  value={judge.benchAssociatedJudgments}
                />
              </div>
            </DataCard>
          ))}
        </div>
      </section>

      <DataCard title="Methodology and Sources">
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-amber-900" href="/methodology">
            Methodology
          </Link>
          <Link className="text-amber-900" href="/sources">
            Sources
          </Link>
          <Link className="text-amber-900" href="/data">
            Data
          </Link>
          <Link className="text-amber-900" href="/launch-checklist">
            Launch checklist
          </Link>
          <Link className="text-amber-900" href="/about">
            About
          </Link>
          <Link className="text-amber-900" href="/research">
            Research
          </Link>
        </div>
      </DataCard>
    </div>
  );
}

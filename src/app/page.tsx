import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { DataCard } from "@/components/DataCard";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { caseTypes, courtClock, formatNumber, judges } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Justice Clock India"
        title="How long does justice take?"
        description="A mobile-first public data tracker for Supreme Court pendency, case-type delay, and public judgment profiles."
      />

      {courtClock.sample ? <SampleDataWarning /> : null}

      <MetricCard
        title="Supreme Court Pending Cases"
        value={formatNumber(courtClock.totalPending)}
        context={`Reporting period: ${courtClock.reportingPeriod}`}
        confidence={courtClock.confidence}
        sourceLabel={courtClock.sourceName}
        sourceHref={courtClock.sourceUrl}
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          title="Instituted This Month"
          value={formatNumber(courtClock.institutedThisMonth)}
          context="New matters entering the court-level snapshot."
          confidence={courtClock.confidence}
          sourceLabel={courtClock.sourceName}
          sourceHref={courtClock.sourceUrl}
        />
        <MetricCard
          title="Disposed This Month"
          value={formatNumber(courtClock.disposedThisMonth)}
          context={`Clearance rate: ${courtClock.clearanceRate ?? "—"}%`}
          confidence={courtClock.confidence}
          sourceLabel={courtClock.sourceName}
          sourceHref={courtClock.sourceUrl}
        />
      </section>

      <AdSlot slotName="home-after-clock" />

      <section className="grid gap-3">
        <Link href="/case-types">
          <DataCard
            eyebrow={`${caseTypes.length} tracked types`}
            title="Case-Type Time to Justice"
            description="See approximate case-age-to-judgment timelines by case type."
          />
        </Link>

        <Link href="/judges">
          <DataCard
            eyebrow={`${judges.length} public profiles`}
            title="Public Judge Profiles"
            description="Judgment metadata profiles, not performance ratings."
          />
        </Link>

        <Link href="/methodology">
          <DataCard
            eyebrow="Trust layer"
            title="Methodology"
            description="How metrics, confidence labels, and caveats work."
          />
        </Link>
      </section>
    </div>
  );
}

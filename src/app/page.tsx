import Link from "next/link";
import { DataCard } from "@/components/DataCard";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Justice Clock India"
        title="How long does justice take?"
        description="A mobile-first public data tracker for Supreme Court pendency, case-type delay, and public judgment profiles."
      />

      <SampleDataWarning />

      <MetricCard
        title="Supreme Court Pending Cases"
        value="92,313"
        context="Sample placeholder for the court-level Justice Clock. Replace with official/generated data before public launch."
        confidence="experimental"
        sourceLabel="Sample"
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          title="Instituted This Month"
          value="6,638"
          context="Sample monthly institution count."
          confidence="experimental"
          sourceLabel="Sample"
        />
        <MetricCard
          title="Disposed This Month"
          value="4,735"
          context="Sample monthly disposal count."
          confidence="experimental"
          sourceLabel="Sample"
        />
      </section>

      <section className="grid gap-3">
        <Link href="/case-types">
          <DataCard
            eyebrow="Product 2"
            title="Case-Type Time to Justice"
            description="See approximate case-age-to-judgment timelines by case type."
          />
        </Link>

        <Link href="/judges">
          <DataCard
            eyebrow="Product 3"
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

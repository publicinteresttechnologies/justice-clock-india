import Link from "next/link";
import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="A sober public-interest prototype for measuring visible court-system delay."
        title="About"
      />

      <DataCard title="Disclaimer">
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Justice Clock India is an independent public data project. It is not
            an official Supreme Court website and does not provide legal advice.
          </p>
          <p>
            Judge pages are public metadata profiles, not performance ratings.
            Case-age metrics are bench-associated unless explicitly marked as
            authored or direct.
          </p>
          <p>
            Where exact filing-to-disposal dates are unavailable,
            time-to-justice metrics use case year or diary year as an
            approximation.
          </p>
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

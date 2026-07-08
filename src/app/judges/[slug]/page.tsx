import { notFound } from "next/navigation";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { KeyValueList } from "@/components/KeyValueList";
import { MetricCard } from "@/components/MetricCard";
import { ProfileDisclaimer } from "@/components/ProfileDisclaimer";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { SourceBadge } from "@/components/SourceBadge";
import { judges } from "@/lib/data";
import { formatYears } from "@/lib/format";

type JudgePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return judges.map((judge) => ({ slug: judge.slug }));
}

export default async function JudgePage({ params }: JudgePageProps) {
  const { slug } = await params;
  const judge = judges.find((item) => item.slug === slug);

  if (!judge) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          {judge.judgeName}
        </h1>
        <p className="text-base font-medium text-slate-700">
          Public Judgment Profile
        </p>
        <ConfidenceBadge level={judge.confidence} />
      </section>

      <CaveatBox>
        This is not a performance rating. It is a public metadata profile based
        on available judgment records.
      </CaveatBox>

      <ProfileDisclaimer />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Authored judgments" value={judge.authoredJudgments} />
        <MetricCard
          label="Bench-associated judgments"
          value={judge.benchAssociatedJudgments}
        />
      </div>

      <MetricCard
        label="Median approximate case age"
        tone="warning"
        value={formatYears(judge.medianCaseAgeYears)}
      />

      <DataCard title="Attribution Labels">
        <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-700">
          <span>Direct</span>
          <span>Bench-associated</span>
          <span>System-associated</span>
          <span>Experimental</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {judge.attributionWarning}
        </p>
      </DataCard>

      <DataCard title="Judgments by Year">
        <KeyValueList items={judge.judgmentsByYear} />
      </DataCard>

      <DataCard title="Judgment Timeline">
        <SimpleBarChart
          data={Object.entries(judge.judgmentsByYear).map(([label, value]) => ({
            label,
            value,
          }))}
        />
      </DataCard>

      <DataCard title="Case-type Mix">
        <KeyValueList items={judge.caseTypeMix} />
      </DataCard>

      <DataCard title="Case-type Mix Chart">
        <SimpleBarChart
          data={Object.entries(judge.caseTypeMix).map(([label, value]) => ({
            label,
            value,
          }))}
        />
      </DataCard>

      <DataCard title="Subject Mix">
        <KeyValueList items={judge.subjectMix} />
      </DataCard>

      <DataCard title="Old-case Involvement">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Older than 5 years" value={judge.casesOlderThan5Years} />
          <MetricCard
            label="Older than 10 years"
            tone="danger"
            value={judge.casesOlderThan10Years}
          />
        </div>
      </DataCard>

      <DataCard title="Bench-size Profile">
        <KeyValueList items={judge.benchSizeProfile} />
      </DataCard>

      <DataCard title="Bench-size Chart">
        <SimpleBarChart
          data={Object.entries(judge.benchSizeProfile).map(([label, value]) => ({
            label,
            value,
          }))}
        />
      </DataCard>

      <div className="flex flex-wrap gap-2">
        {judge.sources.map((source) => (
          <SourceBadge
            key={source.sourceUrl}
            name={source.sourceName}
            url={source.sourceUrl ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}

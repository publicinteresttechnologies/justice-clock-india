import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { SectionHeader } from "@/components/SectionHeader";
import { formatYears, getJudgeBySlug } from "@/lib/data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function JudgeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getJudgeBySlug(slug);

  if (!profile) notFound();

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Public Judgment Profile"
        title={profile.judgeName}
        description="A generated metadata profile based on available judgment records."
      />

      {profile.sample ? <SampleDataWarning /> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          title="Authored Judgments"
          value={String(profile.authoredJudgments)}
          context="Judgment records where this name is listed as author."
          confidence={profile.confidence}
        />
        <MetricCard
          title="Bench Records"
          value={String(profile.benchAssociatedJudgments)}
          context="Judgment records where this name appears on the bench."
          confidence={profile.confidence}
        />
      </section>

      <AdSlot slotName="judge-after-summary" />

      <MetricCard
        title="Median Case-Age Gap"
        value={formatYears(profile.medianCaseAgeYears)}
        context="Approximate gap from case/diary year to judgment year across associated records."
        confidence={profile.confidence}
        sourceLabel={profile.sources[0]?.name ?? "Generated data"}
        sourceHref={profile.sources[0]?.url}
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard title="Cases Older Than 5 Years" value={String(profile.casesOlderThan5Years)} confidence={profile.confidence} />
        <MetricCard title="Cases Older Than 10 Years" value={String(profile.casesOlderThan10Years)} confidence={profile.confidence} />
        <MetricCard title="Oldest Case Age" value={formatYears(profile.oldestCaseAgeYears)} confidence={profile.confidence} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black">Case-type mix</h2>
          <ConfidenceBadge level={profile.confidence} />
        </div>
        <div className="mt-3 space-y-2">
          {profile.caseTypeMix.map((item) => (
            <div key={item.caseType} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">{item.caseType}</span>
              <span className="font-semibold">{item.count} · {item.percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      <CaveatBox title="Attribution warning">
        {profile.attributionWarning} {profile.caveat}
      </CaveatBox>
    </div>
  );
}

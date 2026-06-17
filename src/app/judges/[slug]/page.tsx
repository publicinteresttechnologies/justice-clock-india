import Link from "next/link";
import { notFound } from "next/navigation";
import { CaveatBox } from "@/components/CaveatBox";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { MetricCard } from "@/components/MetricCard";
import { SampleDataWarning } from "@/components/SampleDataWarning";
import { formatNumber, formatYears, getJudgeBySlug } from "@/lib/data";

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
    <div className="space-y-7">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Public judgment profile</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">{profile.judgeName}</h1>
        <p className="mt-4 text-base leading-7 text-slate-200">
          A metadata profile from available judgment records. Bench-associated figures are not direct blame metrics.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <ConfidenceBadge level={profile.confidence} />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-300">Not a rating</span>
        </div>
      </section>

      {profile.sample ? <SampleDataWarning /> : null}

      <CaveatBox title="Attribution warning">
        {profile.attributionWarning} {profile.caveat}
      </CaveatBox>

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          title="Authored judgments"
          value={formatNumber(profile.authoredJudgments)}
          context="Judgment records where this name is listed as author."
          confidence={profile.confidence}
        />
        <MetricCard
          title="Bench records"
          value={formatNumber(profile.benchAssociatedJudgments)}
          context="Judgment records where this name appears on the bench."
          confidence={profile.confidence}
        />
      </section>

      <MetricCard
        title="Median approximate case-age gap"
        value={formatYears(profile.medianCaseAgeYears)}
        context="Gap from case or diary year to judgment year across associated records."
        confidence={profile.confidence}
        sourceLabel={profile.sources[0]?.name ?? "Generated data"}
        sourceHref={profile.sources[0]?.url}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Older than 5 years" value={formatNumber(profile.casesOlderThan5Years)} confidence={profile.confidence} />
        <MetricCard title="Older than 10 years" value={formatNumber(profile.casesOlderThan10Years)} confidence={profile.confidence} />
        <MetricCard title="Oldest case-age gap" value={formatYears(profile.oldestCaseAgeYears)} confidence={profile.confidence} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mix</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Case-type mix</h2>
          </div>
          <ConfidenceBadge level={profile.confidence} />
        </div>
        <div className="mt-4 space-y-2">
          {profile.caseTypeMix.map((item) => (
            <div key={item.caseType} className="flex justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-slate-800">{item.caseType}</span>
              <span className="text-slate-600">{formatNumber(item.count)} · {item.percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Subjects</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Subject tags</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.subjectMix.map((item) => (
            <span key={item.subject} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
              {item.subject} · {item.count}
            </span>
          ))}
        </div>
      </section>

      <Link href="/judges" className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
        Back to judges
      </Link>
    </div>
  );
}

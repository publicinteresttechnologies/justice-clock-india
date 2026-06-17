type PageProps = {
  params: {
    slug: string;
  };
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CaseTypeDetailPage({ params }: PageProps) {
  const title = titleFromSlug(params.slug);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
          Case Type
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Approximate case-age-to-judgment profile.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          Median Time to Judgment
        </p>
        <p className="mt-2 text-5xl font-black tracking-tight">Sample</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This measures the gap between case/diary year and judgment year where
          exact filing-to-disposal dates are not available. It is an
          approximation, not a prediction for your case.
        </p>
      </section>
    </div>
  );
}

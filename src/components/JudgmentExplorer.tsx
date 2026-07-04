"use client";

import { useMemo, useState } from "react";
import type { JudgmentRecord } from "@/lib/schemas";
import { formatNumber } from "@/lib/data";

type JudgmentExplorerProps = {
  judgments: JudgmentRecord[];
};

function includes(value: string | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false;
}

export function JudgmentExplorer({ judgments }: JudgmentExplorerProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleJudgments = useMemo(() => {
    if (!normalizedQuery) return judgments.slice(0, 25);

    return judgments
      .filter((judgment) => {
        return (
          includes(judgment.caseTitle, normalizedQuery) ||
          includes(judgment.caseType, normalizedQuery) ||
          includes(judgment.authoringJudge, normalizedQuery) ||
          judgment.judges.some((judge) => includes(judge, normalizedQuery)) ||
          judgment.subjectTags?.some((tag) => includes(tag, normalizedQuery))
        );
      })
      .slice(0, 25);
  }, [judgments, normalizedQuery]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="judgment-search">
          Search judgment records
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-amber-700"
          id="judgment-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, judge, case type, or tag"
          value={query}
        />
        <p className="text-xs text-slate-500">
          Showing {formatNumber(visibleJudgments.length)} of {formatNumber(judgments.length)} records.
        </p>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {visibleJudgments.map((judgment) => (
          <article className="py-3" key={judgment.id}>
            <h3 className="text-sm font-semibold text-slate-950">{judgment.caseTitle}</h3>
            <p className="mt-1 text-xs text-slate-600">
              {[judgment.judgmentDate ?? judgment.decisionDate, judgment.caseType, judgment.disposalNature]
                .filter(Boolean)
                .join(" • ")}
            </p>
            {judgment.judges.length > 0 ? (
              <p className="mt-1 text-xs text-slate-500">Bench: {judgment.judges.join(", ")}</p>
            ) : null}
            {judgment.sourceUrl ? (
              <a className="mt-2 inline-block text-xs font-semibold text-amber-900" href={judgment.sourceUrl}>
                Source
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

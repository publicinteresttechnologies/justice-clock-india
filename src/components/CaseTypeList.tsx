"use client";

import { useMemo, useState } from "react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { formatYears } from "@/lib/format";
import type { CaseTypeMetric } from "@/lib/schemas";

type CaseTypeListProps = {
  caseTypes: CaseTypeMetric[];
};

export function CaseTypeList({ caseTypes }: CaseTypeListProps) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("case-type");
  const filtered = useMemo(
    () => {
      const cleanQuery = query.toLowerCase().trim();
      return caseTypes
        .filter((item) => item.caseType.toLowerCase().includes(cleanQuery))
        .sort((a, b) => {
          if (sortMode === "longest-gap") {
            return (b.medianCaseAgeYears ?? -1) - (a.medianCaseAgeYears ?? -1);
          }
          if (sortMode === "largest-group") {
            return b.sampleSize - a.sampleSize;
          }

          return a.caseType.localeCompare(b.caseType);
        });
    },
    [caseTypes, query, sortMode],
  );

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by case type"
          type="search"
          value={query}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Sort</span>
        <select
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => setSortMode(event.target.value)}
          value={sortMode}
        >
          <option value="case-type">Case type</option>
          <option value="longest-gap">Longest approximate case-age gap</option>
          <option value="largest-group">Largest case-type group</option>
        </select>
      </label>

      <div className="space-y-3">
        {filtered.map((item) => (
          <DataCard
            href={`/case-types/${item.slug}`}
            key={item.slug}
            subtitle={`${item.sampleSize} sample judgments`}
            title={item.caseType}
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Median approximate case-age-to-judgment
              </p>
              <p className="text-3xl font-semibold text-slate-950">
                {formatYears(item.medianCaseAgeYears)}
              </p>
              <ConfidenceBadge level={item.confidence} />
            </div>
          </DataCard>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DataCard } from "@/components/DataCard";
import { sortedEntries } from "@/lib/format";
import type { JudgeProfile } from "@/lib/schemas";

type JudgeListProps = {
  judges: JudgeProfile[];
};

export function JudgeList({ judges }: JudgeListProps) {
  const [query, setQuery] = useState("");
  const [caseType, setCaseType] = useState("all");
  const [benchSize, setBenchSize] = useState("all");
  const [year, setYear] = useState("all");
  const [sortMode, setSortMode] = useState("alphabetical");
  const caseTypeOptions = useMemo(
    () =>
      [
        ...new Set(
          judges.flatMap((judge) => Object.keys(judge.caseTypeMix)),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [judges],
  );
  const benchSizeOptions = useMemo(
    () =>
      [
        ...new Set(
          judges.flatMap((judge) =>
            Object.keys(judge.benchSizeProfile).map((key) => key.split(" ")[0]),
          ),
        ),
      ].sort((a, b) => Number(a) - Number(b)),
    [judges],
  );
  const yearOptions = useMemo(
    () =>
      [
        ...new Set(
          judges.flatMap((judge) => Object.keys(judge.judgmentsByYear)),
        ),
      ].sort((a, b) => Number(b) - Number(a)),
    [judges],
  );
  const filtered = useMemo(
    () =>
      judges
        .filter((judge) =>
          judge.judgeName.toLowerCase().includes(query.toLowerCase().trim()),
        )
        .filter((judge) => caseType === "all" || judge.caseTypeMix[caseType])
        .filter(
          (judge) =>
            benchSize === "all" ||
            judge.benchSizeProfile[`${benchSize} judge bench`],
        )
        .filter((judge) => year === "all" || judge.judgmentsByYear[year])
        .sort((a, b) => {
          if (sortMode === "longest-gap") {
            return (b.medianCaseAgeYears ?? -1) - (a.medianCaseAgeYears ?? -1);
          }
          if (sortMode === "recent") {
            const latestA = Math.max(...Object.keys(a.judgmentsByYear).map(Number));
            const latestB = Math.max(...Object.keys(b.judgmentsByYear).map(Number));
            return latestB - latestA;
          }

          return a.judgeName.localeCompare(b.judgeName);
        }),
    [benchSize, caseType, judges, query, sortMode, year],
  );

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by judge name"
          type="search"
          value={query}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Case type" onChange={setCaseType} value={caseType}>
          <option value="all">All case types</option>
          {caseTypeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Bench size" onChange={setBenchSize} value={benchSize}>
          <option value="all">All bench sizes</option>
          {benchSizeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Year" onChange={setYear} value={year}>
          <option value="all">All years</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Sort" onChange={setSortMode} value={sortMode}>
          <option value="alphabetical">Alphabetical</option>
          <option value="recent">Most recent judgments</option>
          <option value="longest-gap">Longest approximate case-age gap</option>
        </SelectField>
      </div>

      <div className="space-y-3">
        {filtered.map((judge) => {
          const topCaseType = sortedEntries(judge.caseTypeMix)[0]?.[0] ?? "No case type";
          return (
            <DataCard
              href={`/judges/${judge.slug}`}
              key={judge.slug}
              subtitle={topCaseType}
              title={judge.judgeName}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-600">Authored</p>
                  <p className="text-2xl font-semibold text-slate-950">
                    {judge.authoredJudgments}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Bench-associated</p>
                  <p className="text-2xl font-semibold text-slate-950">
                    {judge.benchAssociatedJudgments}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <ConfidenceBadge level={judge.confidence} />
              </div>
            </DataCard>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none focus:border-amber-700"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DataCard } from "@/components/DataCard";
import { approximateCaseAgeYears } from "@/lib/metrics";
import type { JudgmentRecord } from "@/lib/schemas";

type JudgmentExplorerProps = {
  judgments: JudgmentRecord[];
};

type SortMode = "recent" | "longest-gap" | "largest-bench" | "case-title";

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function displayDate(record: JudgmentRecord) {
  return record.decisionDate ?? record.judgmentDate ?? "Date unavailable";
}

export function JudgmentExplorer({ judgments }: JudgmentExplorerProps) {
  const [query, setQuery] = useState("");
  const [caseType, setCaseType] = useState("all");
  const [judge, setJudge] = useState("all");
  const [benchSize, setBenchSize] = useState("all");
  const [year, setYear] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const caseTypes = useMemo(
    () => uniqueSorted(judgments.map((record) => record.caseType)),
    [judgments],
  );
  const judges = useMemo(
    () => uniqueSorted(judgments.flatMap((record) => record.judges)),
    [judgments],
  );
  const benchSizes = useMemo(
    () =>
      uniqueSorted(
        judgments
          .map((record) => String(record.benchSize))
          .filter((value) => value !== "0"),
      ).sort((a, b) => Number(a) - Number(b)),
    [judgments],
  );
  const years = useMemo(
    () =>
      uniqueSorted(
        judgments
          .map((record) => displayDate(record).slice(0, 4))
          .filter((value) => /^\d{4}$/.test(value)),
      ).sort((a, b) => Number(b) - Number(a)),
    [judgments],
  );

  const filtered = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();

    return judgments
      .filter((record) => {
        const searchable = [
          record.caseTitle,
          record.caseNumber ?? "",
          record.caseType,
          ...record.judges,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!cleanQuery || searchable.includes(cleanQuery)) &&
          (caseType === "all" || record.caseType === caseType) &&
          (judge === "all" || record.judges.includes(judge)) &&
          (benchSize === "all" ||
            (record.benchSize > 0 && String(record.benchSize) === benchSize)) &&
          (year === "all" || displayDate(record).startsWith(year))
        );
      })
      .sort((a, b) => {
        if (sortMode === "longest-gap") {
          return (
            (approximateCaseAgeYears(b) ?? -1) -
            (approximateCaseAgeYears(a) ?? -1)
          );
        }
        if (sortMode === "largest-bench") {
          return b.benchSize - a.benchSize;
        }
        if (sortMode === "case-title") {
          return a.caseTitle.localeCompare(b.caseTitle);
        }

        return displayDate(b).localeCompare(displayDate(a));
      });
  }, [benchSize, caseType, judge, judgments, query, sortMode, year]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Case title, judge name, or case type"
          type="search"
          value={query}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Case type" onChange={setCaseType} value={caseType}>
          <option value="all">All case types</option>
          {caseTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Judge" onChange={setJudge} value={judge}>
          <option value="all">All judges</option>
          {judges.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Bench size" onChange={setBenchSize} value={benchSize}>
          <option value="all">All bench sizes</option>
          {benchSizes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField label="Year" onChange={setYear} value={year}>
          <option value="all">All years</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <SelectField
        label="Sort"
        onChange={(value) => setSortMode(value as SortMode)}
        value={sortMode}
      >
        <option value="recent">Most recent judgments</option>
        <option value="longest-gap">Longest approximate case-age gap</option>
        <option value="largest-bench">Largest benches</option>
        <option value="case-title">Case title</option>
      </SelectField>

      <p className="text-sm font-medium text-slate-600">
        Showing {filtered.length} of {judgments.length} judgment records
      </p>

      <div className="space-y-3">
        {filtered.slice(0, 25).map((record) => (
          <DataCard
            key={record.id}
            subtitle={`${record.caseType} - ${displayDate(record)}`}
            title={record.caseTitle}
          >
            <div className="space-y-2 text-sm leading-6 text-slate-700">
              <p>Bench: {record.judges.join("; ") || "Not available in source"}</p>
              <p>
                Bench size:{" "}
                {record.benchSize > 0 ? record.benchSize : "Not available"}
              </p>
              <p>
                Approximate case-age-to-judgment gap:{" "}
                {approximateCaseAgeYears(record) ?? "Unavailable"} years
              </p>
              {record.sourceUrl ? (
                <a className="font-semibold text-amber-900" href={record.sourceUrl}>
                  Source record
                </a>
              ) : null}
            </div>
          </DataCard>
        ))}
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

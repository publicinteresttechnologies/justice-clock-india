"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DataCard } from "@/components/DataCard";
import { approximateCaseAgeYears } from "@/lib/metrics";
import type { JudgmentRecord } from "@/lib/schemas";

type SortMode = "recent" | "longest-gap" | "largest-bench" | "case-title";

type Facets = {
  caseTypes: string[];
  judges: string[];
  benchSizes: string[];
  years: string[];
};

const emptyFacets: Facets = { caseTypes: [], judges: [], benchSizes: [], years: [] };

function displayDate(record: JudgmentRecord) {
  return record.decisionDate ?? record.judgmentDate ?? "Date unavailable";
}

export function JudgmentExplorer() {
  const [results, setResults] = useState<JudgmentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [caseType, setCaseType] = useState("all");
  const [judge, setJudge] = useState("all");
  const [benchSize, setBenchSize] = useState("all");
  const [year, setYear] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(queryInput), 300);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoadState("loading");
      }
    });

    const params = new URLSearchParams({
      q: query,
      caseType,
      judge,
      benchSize,
      year,
      sort: sortMode,
      page: "1",
    });

    fetch(`/api/judgments?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load judgments: ${response.status}`);
        }
        return response.json() as Promise<{
          results: JudgmentRecord[];
          total: number;
          facets: Facets;
        }>;
      })
      .then((payload) => {
        if (active) {
          setResults(payload.results);
          setTotal(payload.total);
          setFacets(payload.facets);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (active) {
          setLoadState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [benchSize, caseType, judge, query, sortMode, year]);

  const caseTypes = useMemo(() => facets.caseTypes, [facets]);
  const judges = useMemo(() => facets.judges, [facets]);
  const benchSizes = useMemo(() => facets.benchSizes, [facets]);
  const years = useMemo(() => facets.years, [facets]);

  return (
    <div className="space-y-4">
      {loadState === "loading" ? (
        <DataCard title="Loading judgment records">
          <p className="text-sm leading-6 text-slate-700">
            Searching the public judgment metadata corpus.
          </p>
        </DataCard>
      ) : null}

      {loadState === "error" ? (
        <DataCard title="Judgment records unavailable">
          <p className="text-sm leading-6 text-slate-700">
            The public judgment metadata search could not be loaded in this
            browser session.
          </p>
        </DataCard>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Case title, judge name, or case type"
          type="search"
          value={queryInput}
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
        Showing {results.length} of {total} judgment records
      </p>

      <div className="space-y-3">
        {results.map((record) => (
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

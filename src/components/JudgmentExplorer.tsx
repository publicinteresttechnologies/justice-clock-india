"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { DataCard } from "@/components/DataCard";
import {
  judgmentDisplayDate,
  type JudgmentQueryResponse,
  type JudgmentSortMode,
} from "@/lib/judgment-query";
import { approximateCaseAgeYears } from "@/lib/metrics";

const EMPTY_RESULT: JudgmentQueryResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  pageCount: 1,
  filters: {
    caseTypes: [],
    judges: [],
    benchSizes: [],
    years: [],
  },
};

export function JudgmentExplorer() {
  const [result, setResult] = useState<JudgmentQueryResponse>(EMPTY_RESULT);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [caseType, setCaseType] = useState("all");
  const [judge, setJudge] = useState("all");
  const [benchSize, setBenchSize] = useState("all");
  const [year, setYear] = useState("all");
  const [sortMode, setSortMode] = useState<JudgmentSortMode>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "25",
      sort: sortMode,
    });

    if (debouncedQuery) params.set("query", debouncedQuery);
    if (caseType !== "all") params.set("caseType", caseType);
    if (judge !== "all") params.set("judge", judge);
    if (benchSize !== "all") params.set("benchSize", benchSize);
    if (year !== "all") params.set("year", year);

    fetch(`/api/judgments?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load judgment records: ${response.status}`);
        }
        return response.json() as Promise<JudgmentQueryResponse>;
      })
      .then((nextResult) => {
        setResult(nextResult);
        if (nextResult.page !== page) setPage(nextResult.page);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadState("error");
      });

    return () => controller.abort();
  }, [benchSize, caseType, debouncedQuery, judge, page, sortMode, year]);

  const firstVisible = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const lastVisible = Math.min(result.page * result.pageSize, result.total);

  function beginLoad() {
    setLoadState("loading");
  }

  function resetPageAnd(setter: (value: string) => void, value: string) {
    beginLoad();
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {loadState === "loading" ? (
        <DataCard title="Loading judgment records">
          <p className="text-sm leading-6 text-slate-700">
            Loading a paginated slice of the public judgment metadata corpus.
          </p>
        </DataCard>
      ) : null}

      {loadState === "error" ? (
        <DataCard title="Judgment records unavailable">
          <p className="text-sm leading-6 text-slate-700">
            The paginated judgment endpoint could not be loaded in this browser
            session.
          </p>
        </DataCard>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Search</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-amber-700"
          onChange={(event) => {
            beginLoad();
            setQuery(event.target.value);
          }}
          placeholder="Case title, judge name, or case type"
          type="search"
          value={query}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Case type"
          onChange={(value) => resetPageAnd(setCaseType, value)}
          value={caseType}
        >
          <option value="all">All case types</option>
          {result.filters.caseTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Judge"
          onChange={(value) => resetPageAnd(setJudge, value)}
          value={judge}
        >
          <option value="all">All judges</option>
          {result.filters.judges.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Bench size"
          onChange={(value) => resetPageAnd(setBenchSize, value)}
          value={benchSize}
        >
          <option value="all">All bench sizes</option>
          {result.filters.benchSizes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Year"
          onChange={(value) => resetPageAnd(setYear, value)}
          value={year}
        >
          <option value="all">All years</option>
          {result.filters.years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <SelectField
        label="Sort"
        onChange={(value) => {
          beginLoad();
          setSortMode(value as JudgmentSortMode);
          setPage(1);
        }}
        value={sortMode}
      >
        <option value="recent">Most recent judgments</option>
        <option value="longest-gap">Longest approximate case-age gap</option>
        <option value="largest-bench">Largest benches</option>
        <option value="case-title">Case title</option>
      </SelectField>

      <p aria-live="polite" className="text-sm font-medium text-slate-600">
        Showing {firstVisible}-{lastVisible} of {result.total} judgment records
      </p>

      <div className="space-y-3">
        {result.items.map((record) => (
          <DataCard
            key={record.id}
            subtitle={`${record.caseType} - ${judgmentDisplayDate(record) || "Date unavailable"}`}
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

      <div className="flex items-center justify-between gap-3">
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={loadState === "loading" || result.page <= 1}
          onClick={() => {
            beginLoad();
            setPage((current) => Math.max(1, current - 1));
          }}
          type="button"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-slate-600">
          Page {result.page} of {result.pageCount}
        </span>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={loadState === "loading" || result.page >= result.pageCount}
          onClick={() => {
            beginLoad();
            setPage((current) => current + 1);
          }}
          type="button"
        >
          Next
        </button>
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

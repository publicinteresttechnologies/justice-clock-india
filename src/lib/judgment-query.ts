import { approximateCaseAgeYears } from "./metrics";
import type { JudgmentRecord } from "./schemas";

export type JudgmentSortMode =
  | "recent"
  | "longest-gap"
  | "largest-bench"
  | "case-title";

export type JudgmentFilterOptions = {
  caseTypes: string[];
  judges: string[];
  benchSizes: number[];
  years: number[];
};

export type JudgmentQuery = {
  query?: string;
  caseType?: string;
  judge?: string;
  benchSize?: number;
  year?: number;
  sort?: JudgmentSortMode;
  page?: number;
  pageSize?: number;
};

export type JudgmentQueryResponse = {
  items: JudgmentRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  filters: JudgmentFilterOptions;
};

export function judgmentDisplayDate(record: JudgmentRecord) {
  return record.decisionDate ?? record.judgmentDate ?? "";
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function buildJudgmentFilterOptions(
  records: JudgmentRecord[],
): JudgmentFilterOptions {
  return {
    caseTypes: uniqueSorted(records.map((record) => record.caseType)),
    judges: uniqueSorted(records.flatMap((record) => record.judges)),
    benchSizes: [
      ...new Set(
        records
          .map((record) => record.benchSize)
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    ].sort((a, b) => a - b),
    years: [
      ...new Set(
        records
          .map((record) => Number(judgmentDisplayDate(record).slice(0, 4)))
          .filter((value) => Number.isInteger(value) && value >= 1950),
      ),
    ].sort((a, b) => b - a),
  };
}

function matchesQuery(record: JudgmentRecord, query: string) {
  if (!query) return true;
  const searchable = [
    record.caseTitle,
    record.caseNumber ?? "",
    record.caseType,
    ...record.judges,
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

export function queryJudgmentRecords(
  records: JudgmentRecord[],
  input: JudgmentQuery,
  filters = buildJudgmentFilterOptions(records),
): JudgmentQueryResponse {
  const cleanQuery = input.query?.toLowerCase().trim() ?? "";
  const sort = input.sort ?? "recent";
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));

  const filtered = records
    .filter(
      (record) =>
        matchesQuery(record, cleanQuery) &&
        (!input.caseType || record.caseType === input.caseType) &&
        (!input.judge || record.judges.includes(input.judge)) &&
        (!input.benchSize || record.benchSize === input.benchSize) &&
        (!input.year ||
          judgmentDisplayDate(record).startsWith(String(input.year))),
    )
    .sort((a, b) => {
      if (sort === "longest-gap") {
        return (
          (approximateCaseAgeYears(b) ?? -1) -
          (approximateCaseAgeYears(a) ?? -1)
        );
      }
      if (sort === "largest-bench") {
        return b.benchSize - a.benchSize;
      }
      if (sort === "case-title") {
        return a.caseTitle.localeCompare(b.caseTitle);
      }
      return judgmentDisplayDate(b).localeCompare(judgmentDisplayDate(a));
    });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageCount, Math.max(1, input.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    pageCount,
    filters,
  };
}

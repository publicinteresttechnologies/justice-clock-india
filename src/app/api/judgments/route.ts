import { NextRequest, NextResponse } from "next/server";
import { judgments } from "@/lib/data";
import { approximateCaseAgeYears } from "@/lib/metrics";
import type { JudgmentRecord } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function displayDate(record: JudgmentRecord) {
  return record.decisionDate ?? record.judgmentDate ?? "";
}

const facets = {
  caseTypes: uniqueSorted(judgments.map((record) => record.caseType)),
  judges: uniqueSorted(judgments.flatMap((record) => record.judges)),
  benchSizes: uniqueSorted(
    judgments
      .map((record) => String(record.benchSize))
      .filter((value) => value !== "0"),
  ).sort((a, b) => Number(a) - Number(b)),
  years: uniqueSorted(
    judgments
      .map((record) => displayDate(record).slice(0, 4))
      .filter((value) => /^\d{4}$/.test(value)),
  ).sort((a, b) => Number(b) - Number(a)),
};

type SortMode = "recent" | "longest-gap" | "largest-bench" | "case-title";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").toLowerCase().trim();
  const caseType = params.get("caseType") ?? "all";
  const judge = params.get("judge") ?? "all";
  const benchSize = params.get("benchSize") ?? "all";
  const year = params.get("year") ?? "all";
  const sortMode = (params.get("sort") ?? "recent") as SortMode;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const filtered = judgments.filter((record) => {
    const searchable = [
      record.caseTitle,
      record.caseNumber ?? "",
      record.caseType,
      ...record.judges,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (caseType === "all" || record.caseType === caseType) &&
      (judge === "all" || record.judges.includes(judge)) &&
      (benchSize === "all" ||
        (record.benchSize > 0 && String(record.benchSize) === benchSize)) &&
      (year === "all" || displayDate(record).startsWith(year))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "longest-gap") {
      return (
        (approximateCaseAgeYears(b) ?? -1) - (approximateCaseAgeYears(a) ?? -1)
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

  const start = (page - 1) * PAGE_SIZE;
  const results = sorted.slice(start, start + PAGE_SIZE);

  return NextResponse.json({
    results,
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    facets,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getJudgmentQueryResult } from "@/lib/server/judgment-store";
import type { JudgmentSortMode } from "@/lib/judgment-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORT_MODES = new Set<JudgmentSortMode>([
  "recent",
  "longest-gap",
  "largest-bench",
  "case-title",
]);

function positiveInteger(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestedSort = params.get("sort") as JudgmentSortMode | null;

  const result = await getJudgmentQueryResult({
    query: params.get("query") ?? undefined,
    caseType: params.get("caseType") ?? undefined,
    judge: params.get("judge") ?? undefined,
    benchSize: positiveInteger(params.get("benchSize")),
    year: positiveInteger(params.get("year")),
    sort:
      requestedSort && SORT_MODES.has(requestedSort)
        ? requestedSort
        : "recent",
    page: positiveInteger(params.get("page")),
    pageSize: positiveInteger(params.get("pageSize")),
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      "X-Total-Count": String(result.total),
    },
  });
}

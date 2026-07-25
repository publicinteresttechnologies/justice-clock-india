import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildJudgmentFilterOptions,
  queryJudgmentRecords,
  type JudgmentFilterOptions,
  type JudgmentQuery,
  type JudgmentQueryResponse,
} from "../judgment-query";
import { judgmentsSchema, type JudgmentRecord } from "../schemas";

const judgmentsPath = join(
  process.cwd(),
  "public",
  "data",
  "judgments.json",
);

let recordsPromise: Promise<JudgmentRecord[]> | undefined;
let filtersPromise: Promise<JudgmentFilterOptions> | undefined;

async function loadJudgments() {
  recordsPromise ??= readFile(judgmentsPath, "utf8").then((text) =>
    judgmentsSchema.parse(JSON.parse(text)),
  );
  return recordsPromise;
}

async function loadFilters() {
  filtersPromise ??= loadJudgments().then(buildJudgmentFilterOptions);
  return filtersPromise;
}

export async function getJudgmentQueryResult(
  query: JudgmentQuery,
): Promise<JudgmentQueryResponse> {
  const [records, filters] = await Promise.all([
    loadJudgments(),
    loadFilters(),
  ]);
  return queryJudgmentRecords(records, query, filters);
}

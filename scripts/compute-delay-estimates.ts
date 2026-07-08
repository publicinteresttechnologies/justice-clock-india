import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadSourceData } from "./lib/source-data";
import { approximateCaseAgeYears, median, percentile } from "../src/lib/metrics";
import type { JudgmentRecord } from "../src/lib/schemas";

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(path: string, headers: string[], rows: Record<string, string | number | null>[]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => csvEscape(String(row[header] ?? ""))).join(","),
      ),
    ].join("\n") + "\n",
  );
}

function startSignal(record: JudgmentRecord) {
  if (record.diaryYear) {
    return { year: record.diaryYear, confidence: "medium", signal: "diaryYear" };
  }
  if (record.caseYear) {
    return { year: record.caseYear, confidence: "medium", signal: "caseYear" };
  }
  const text = [record.caseNumber, record.caseTitle].filter(Boolean).join(" ");
  const inferred = text.match(/\b(19[5-9]\d|20\d{2})\b/)?.[1];
  if (inferred) {
    return { year: Number(inferred), confidence: "low", signal: "inferredYear" };
  }
  return null;
}

function judgmentYear(record: JudgmentRecord) {
  const date = record.decisionDate ?? record.judgmentDate;
  return date ? Number(date.slice(0, 4)) : null;
}

function main() {
  const { judgments, judgmentsSource } = loadSourceData(process.cwd());
  const auditRows: Record<string, string | number | null>[] = [];
  const estimateRows: Record<string, string | number | null>[] = [];

  for (const record of judgments) {
    const signal = startSignal(record);
    const endYear = judgmentYear(record);
    const estimatedDelay = approximateCaseAgeYears(record);
    const usable =
      signal !== null &&
      endYear !== null &&
      estimatedDelay !== null &&
      estimatedDelay >= 0 &&
      estimatedDelay <= 80;

    auditRows.push({
      id: record.id,
      caseTitle: record.caseTitle,
      judgmentYear: endYear,
      startSignal: signal?.signal ?? "none",
      estimatedStartYear: signal?.year ?? null,
      status: usable ? "usable" : "excluded",
    });

    if (usable) {
      estimateRows.push({
        id: record.id,
        caseTitle: record.caseTitle,
        judgmentYear: endYear,
        estimatedStartYear: signal.year,
        estimatedDelayYears: estimatedDelay,
        confidence: signal.confidence,
      });
    }
  }

  const delays = estimateRows.map((row) => Number(row.estimatedDelayYears));
  const confidenceBreakdown = estimateRows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.confidence);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  writeCsv(
    "data/research/sc-delay-field-audit.csv",
    ["id", "caseTitle", "judgmentYear", "startSignal", "estimatedStartYear", "status"],
    auditRows,
  );
  writeCsv(
    "data/research/sc-delay-estimates.csv",
    ["id", "caseTitle", "judgmentYear", "estimatedStartYear", "estimatedDelayYears", "confidence"],
    estimateRows,
  );
  writeJson("public/data/delay-summary.json", {
    generatedAt: new Date().toISOString(),
    source: existsSync("data/research/sc-judgments-2000-2024.csv")
      ? "data/research/sc-judgments-2000-2024.csv"
      : judgmentsSource.path,
    recordsAnalyzed: judgments.length,
    recordsUsable: estimateRows.length,
    recordsExcluded: judgments.length - estimateRows.length,
    confidenceBreakdown,
    medianDelayYears: median(delays),
    p75DelayYears: percentile(delays, 75),
    p90DelayYears: percentile(delays, 90),
    longestDelays: [...estimateRows]
      .sort((a, b) => Number(b.estimatedDelayYears) - Number(a.estimatedDelayYears))
      .slice(0, 20),
    limitations: [
      "This is historical estimated time-to-judgment, not exact delay of all cases.",
      "Estimates are excluded when no credible start-year signal is available.",
    ],
  });
  console.log(`OK: wrote ${estimateRows.length} usable delay estimates.`);
}

try {
  main();
} catch (error) {
  console.error("Delay estimate computation failed.");
  console.error(error);
  process.exit(1);
}

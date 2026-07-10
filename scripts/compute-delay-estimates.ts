import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadSourceData } from "./lib/source-data";
import {
  buildDelaySummaryFromJudgments,
  computeDelayEstimates,
} from "../src/lib/metrics";

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

function main() {
  const { judgments, judgmentsSource } = loadSourceData(process.cwd());
  const { auditRows, estimates } = computeDelayEstimates(judgments);

  writeCsv(
    "data/research/sc-delay-field-audit.csv",
    ["id", "caseTitle", "judgmentYear", "startSignal", "estimatedStartYear", "status"],
    auditRows,
  );
  writeCsv(
    "data/research/sc-delay-estimates.csv",
    [
      "id",
      "caseTitle",
      "judgmentYear",
      "estimatedStartYear",
      "estimatedDelayYears",
      "confidence",
      "startSignal",
    ],
    estimates,
  );
  writeJson(
    "data/research/sc-delay-summary.json",
    buildDelaySummaryFromJudgments(
      judgments,
      existsSync("data/research/sc-judgments-2000-2024.csv")
      ? "data/research/sc-judgments-2000-2024.csv"
      : judgmentsSource.path,
      judgmentsSource.mode === "sample" ? "sample" : "generated",
    ),
  );
  console.log(`OK: wrote ${estimates.length} usable delay estimates.`);
}

try {
  main();
} catch (error) {
  console.error("Delay estimate computation failed.");
  console.error(error);
  process.exit(1);
}

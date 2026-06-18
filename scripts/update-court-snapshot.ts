import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Snapshot = {
  sourceName: string;
  sourceUrl?: string;
  capturedAt: string;
  reportingPeriod: string;
  totalPending: number;
  civilPending?: number;
  criminalPending?: number;
  institutedThisMonth?: number;
  disposedThisMonth?: number;
  casesOlderThan5Years?: number;
  casesOlderThan10Years?: number;
  confidence: "high" | "medium-high" | "medium" | "low" | "experimental";
  notes?: string[];
  sample?: boolean;
};

const root = process.cwd();
const outputPath = path.join(root, "data/imports/court-snapshot.json");

function numberFromEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function requiredNumberFromEnv(name: string) {
  const value = numberFromEnv(name);
  if (value === undefined) {
    throw new Error(`${name} is required for manual snapshot update.`);
  }
  return value;
}

function todayIso() {
  return new Date().toISOString();
}

async function writeSnapshot(snapshot: Snapshot) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function main() {
  const manualTotalPending = process.env.TOTAL_PENDING;

  if (!manualTotalPending) {
    console.log("No TOTAL_PENDING provided. Existing court snapshot left unchanged.");
    console.log("Set TOTAL_PENDING plus SOURCE_URL/SOURCE_NAME/REPORTING_PERIOD to update the official snapshot.");
    return;
  }

  const snapshot: Snapshot = {
    sourceName: process.env.SOURCE_NAME || "Manual official Supreme Court snapshot",
    sourceUrl: process.env.SOURCE_URL,
    capturedAt: todayIso(),
    reportingPeriod: process.env.REPORTING_PERIOD || todayIso().slice(0, 10),
    totalPending: requiredNumberFromEnv("TOTAL_PENDING"),
    civilPending: numberFromEnv("CIVIL_PENDING"),
    criminalPending: numberFromEnv("CRIMINAL_PENDING"),
    institutedThisMonth: numberFromEnv("INSTITUTED_THIS_MONTH"),
    disposedThisMonth: numberFromEnv("DISPOSED_THIS_MONTH"),
    casesOlderThan5Years: numberFromEnv("CASES_OLDER_THAN_5_YEARS"),
    casesOlderThan10Years: numberFromEnv("CASES_OLDER_THAN_10_YEARS"),
    confidence: (process.env.CONFIDENCE as Snapshot["confidence"]) || "medium",
    notes: [
      "Snapshot updated by scripts/update-court-snapshot.ts.",
      "Missing fields are intentionally omitted rather than estimated.",
      ...(process.env.SNAPSHOT_NOTE ? [process.env.SNAPSHOT_NOTE] : []),
    ],
    sample: false,
  };

  await writeSnapshot(snapshot);
}

main().catch((error) => {
  console.error("Court snapshot update failed.");
  console.error(error);
  process.exit(1);
});

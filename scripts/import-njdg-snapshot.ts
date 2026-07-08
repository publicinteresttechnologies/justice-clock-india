import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { courtSnapshotSchema } from "../src/lib/schemas";

const INPUT_PATH = "data/imports/court-snapshot.json";

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function main() {
  if (!existsSync(INPUT_PATH)) {
    throw new Error(`${INPUT_PATH} is missing. Add a manually captured Supreme Court snapshot first.`);
  }

  const snapshot = courtSnapshotSchema.parse(
    JSON.parse(readFileSync(INPUT_PATH, "utf8")),
  );
  const normalized = {
    sourceName: snapshot.sourceName,
    sourceUrl: snapshot.sourceUrl,
    capturedAt: snapshot.capturedAt,
    reportingPeriod: snapshot.reportingPeriod,
    totalPending: snapshot.totalPending,
    civilPending: snapshot.civilPending ?? null,
    criminalPending: snapshot.criminalPending ?? null,
    institutedThisMonth: snapshot.institutedThisMonth ?? null,
    disposedThisMonth: snapshot.disposedThisMonth ?? null,
    oldCasesDisposedThisMonth: snapshot.oldCasesDisposedThisMonth ?? null,
    coramPending: snapshot.coramPending ?? [],
    confidence: snapshot.confidence,
    limitations: snapshot.notes,
    isOfficialApi: false,
    captureMethod: "manual",
  };

  writeJson("public/data/njdg-latest.json", normalized);
  writeJson(
    join("data", "research", "njdg-snapshots", `${datePart(snapshot.capturedAt)}.json`),
    normalized,
  );
  console.log("OK: wrote public/data/njdg-latest.json");
}

try {
  main();
} catch (error) {
  console.error("NJDG snapshot import failed.");
  console.error(error);
  process.exit(1);
}

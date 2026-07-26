import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseNjdgSnapshotHtml } from "../src/lib/njdg-parser";
import { courtSnapshotSchema } from "../src/lib/schemas";

const INPUT_PATH = "data/imports/court-snapshot.json";
const LIVE_SOURCE_URL = "https://scdg.sci.gov.in/scnjdg/?p=home";

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function fetchLiveSnapshot() {
  const response = await fetch(LIVE_SOURCE_URL, {
    headers: {
      "User-Agent": "Justice Clock India public-source snapshot importer",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`NJDG returned ${response.status} ${response.statusText}.`);
  }
  const html = await response.text();
  if (html.length < 10_000) {
    throw new Error(`NJDG returned an unexpectedly short page (${html.length} bytes).`);
  }
  const snapshot = courtSnapshotSchema.parse(
    parseNjdgSnapshotHtml(html, LIVE_SOURCE_URL),
  );
  writeJson(INPUT_PATH, snapshot);
  console.log(
    `OK: captured NJDG snapshot ${snapshot.capturedAt} with ${snapshot.totalPending} pending cases`,
  );
  return snapshot;
}

async function main() {
  const snapshot = hasFlag("fetch-live")
    ? await fetchLiveSnapshot()
    : (() => {
        if (!existsSync(INPUT_PATH)) {
          throw new Error(
            `${INPUT_PATH} is missing. Add a captured Supreme Court snapshot or use --fetch-live.`,
          );
        }
        return courtSnapshotSchema.parse(
          JSON.parse(readFileSync(INPUT_PATH, "utf8")),
        );
      })();

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
    captureMethod: hasFlag("fetch-live") ? "automated-public-html" : "committed-snapshot",
  };

  writeJson("public/data/njdg-latest.json", normalized);
  writeJson(
    join("data", "research", "njdg-snapshots", `${datePart(snapshot.capturedAt)}.json`),
    normalized,
  );
  console.log("OK: wrote public/data/njdg-latest.json");
}

main().catch((error) => {
  console.error("NJDG snapshot import failed.");
  console.error(error);
  process.exit(1);
});

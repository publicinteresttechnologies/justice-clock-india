import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { courtSnapshotSchema } from "../src/lib/schemas";

const SOURCE_URL = "https://njdg.ecourts.gov.in/scnjdg/";
const OUTPUT_PATH = "data/imports/court-snapshot.json";

function parseCount(html: string, label: string): number {
  const idx = html.indexOf(label);
  if (idx === -1) {
    throw new Error(`Could not find "${label}" in the fetched NJDG page.`);
  }

  const after = html.slice(idx, idx + 400);
  const match = after.match(/<\/(?:span|h4)>\s*(?:<span[^>]*>)?\s*([\d,]+)/);
  if (!match) {
    throw new Error(`Found "${label}" but could not parse a number after it.`);
  }

  const value = Number(match[1].replaceAll(",", ""));
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Parsed a non-numeric value for "${label}": ${match[1]}`);
  }

  return value;
}

function requireSum(a: number, b: number, total: number, label: string) {
  if (a + b !== total) {
    throw new Error(
      `${label}: parsed civil (${a}) + criminal (${b}) != total (${total}). Refusing to write inconsistent data.`,
    );
  }
}

async function main() {
  if (!existsSync(OUTPUT_PATH)) {
    throw new Error(`${OUTPUT_PATH} is missing. Add an initial manually captured snapshot first.`);
  }

  const previous = courtSnapshotSchema.parse(
    JSON.parse(readFileSync(OUTPUT_PATH, "utf8")),
  );

  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "justice-clock-india-njdg-snapshot" },
  });
  if (!response.ok) {
    throw new Error(`Fetching ${SOURCE_URL} failed with status ${response.status}.`);
  }
  const html = await response.text();

  const civilPending = parseCount(html, "Pending Civil Cases");
  const criminalPending = parseCount(html, "Pending Criminal Cases");
  const totalPending = parseCount(html, "Total Pending Cases");
  requireSum(civilPending, criminalPending, totalPending, "Pending cases");

  const institutedCivil = parseCount(html, "Instituted in last month civil cases");
  const institutedCriminal = parseCount(html, "Instituted in last month criminal cases");
  const institutedTotal = parseCount(html, "Instituted in last month total cases");
  requireSum(institutedCivil, institutedCriminal, institutedTotal, "Instituted this month");

  const disposedCivil = parseCount(html, "Disposal in last month civil cases");
  const disposedCriminal = parseCount(html, "Disposal in last month criminal cases");
  const disposedTotal = parseCount(html, "Disposal in last month total cases");
  requireSum(disposedCivil, disposedCriminal, disposedTotal, "Disposed this month");

  const capturedAt = new Date().toISOString();
  const reportingDate = capturedAt.slice(0, 10);

  const snapshot = {
    sourceName: previous.sourceName,
    sourceUrl: previous.sourceUrl,
    capturedAt,
    reportingPeriod: `As captured from NJDG Supreme Court dashboard on ${reportingDate}`,
    totalPending,
    civilPending,
    criminalPending,
    institutedThisMonth: institutedTotal,
    disposedThisMonth: disposedTotal,
    oldCasesDisposedThisMonth: null,
    coramPending: previous.coramPending,
    confidence: "medium-high" as const,
    notes: [
      `Supreme Court of India pendency and monthly institution/disposal figures captured automatically from the National Judicial Data Grid Supreme Court dashboard 'At a Glance' view (${SOURCE_URL}, which redirects to scdg.sci.gov.in/scnjdg/) via a scheduled fetch. Civil/criminal split, institution, and disposal figures are read directly from labelled HTML elements on the source page and cross-checked (civil + criminal = total) before being accepted.`,
      `institutedThisMonth and disposedThisMonth are the source's 'last month' figures (civil + criminal combined: instituted ${institutedCivil}+${institutedCriminal}=${institutedTotal}, disposed ${disposedCivil}+${disposedCriminal}=${disposedTotal}); the source does not label which calendar month this covers.`,
      "coramPending (bench-size pending) is carried over from the last manual capture and is not refreshed by this automated fetch; it covers only 3-judge-and-larger benches and excludes connected/tagged matters and single/2-judge pending counts. Do not treat it as a complete bench-size distribution.",
      "oldCasesDisposedThisMonth is not published by the source as a monthly figure and is not estimated.",
    ],
  };

  const parsed = courtSnapshotSchema.parse(snapshot);
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(`OK: wrote ${OUTPUT_PATH} (totalPending=${totalPending}, capturedAt=${capturedAt})`);
}

main().catch((error) => {
  console.error("NJDG live snapshot fetch failed.");
  console.error(error);
  process.exit(1);
});

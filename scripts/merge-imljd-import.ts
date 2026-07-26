import { readFileSync, writeFileSync } from "node:fs";

const SOURCE_NAME = "IMLJD open dataset";
const CSV_HEADERS = [
  "id",
  "caseTitle",
  "caseNumber",
  "diaryNumber",
  "diaryYear",
  "caseType",
  "caseYear",
  "decisionDate",
  "judgmentDate",
  "uploadDate",
  "disposalNature",
  "judges",
  "authoringJudge",
  "benchSize",
  "subjectTags",
  "sourceName",
  "sourceUrl",
  "confidence",
  "sample",
] as const;

type Header = (typeof CSV_HEADERS)[number];
type RecordRow = Record<Header, string>;

function arg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function parseCsv(text: string): RecordRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  const [headers, ...data] = rows;
  if (!headers) throw new Error("CSV has no header row.");

  return data.map((values) => {
    const raw = Object.fromEntries(
      headers.map((header, index) => [header.trim(), values[index] ?? ""]),
    ) as Record<string, string>;
    return Object.fromEntries(
      CSV_HEADERS.map((header) => [header, raw[header] ?? ""]),
    ) as RecordRow;
  });
}

function escapeCsv(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function writeCsv(path: string, records: RecordRow[]) {
  const lines = [
    CSV_HEADERS.join(","),
    ...records.map((record) =>
      CSV_HEADERS.map((header) => escapeCsv(record[header])).join(","),
    ),
  ];
  writeFileSync(path, `${lines.join("\n")}\n`);
}

const basePath = arg("base");
const freshPath = arg("fresh");
const outputPath = arg("output");
if (!basePath || !freshPath || !outputPath) {
  throw new Error("Use --base=PATH --fresh=PATH --output=PATH.");
}

const base = parseCsv(readFileSync(basePath, "utf8"));
const fresh = parseCsv(readFileSync(freshPath, "utf8")).filter(
  (record) => record.sourceName === SOURCE_NAME,
);
if (fresh.length < 1000) {
  throw new Error(`Expected at least 1000 refreshed IMLJD rows, got ${fresh.length}.`);
}

const merged = new Map<string, RecordRow>();
for (const record of base) {
  if (record.sourceName !== SOURCE_NAME) merged.set(record.id, record);
}
for (const record of fresh) merged.set(record.id, record);

const records = [...merged.values()].sort((a, b) =>
  (a.judgmentDate || a.decisionDate).localeCompare(
    b.judgmentDate || b.decisionDate,
  ),
);
writeCsv(outputPath, records);
console.log(
  `OK: preserved ${base.length - base.filter((record) => record.sourceName === SOURCE_NAME).length} non-IMLJD rows and merged ${fresh.length} refreshed IMLJD rows.`,
);
console.log(`OK: wrote ${records.length} rows to ${outputPath}.`);

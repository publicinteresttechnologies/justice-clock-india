import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const GITHUB_URL = "https://github.com/joyboseroy/imljd";
const SOURCE_NAME = "IMLJD open dataset";
const OUTPUT_PATH = "data/imports/judgments.csv";

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

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRecord = Record<CsvHeader, string>;

const REMOTE_CSV_URLS = [
  "https://huggingface.co/datasets/joyboseroy/imljd/resolve/main/data/parquet/sc_enriched.csv",
  "https://huggingface.co/datasets/joyboseroy/imljd/resolve/main/sc_enriched.csv",
  "https://huggingface.co/datasets/joyboseroy/imljd/resolve/main/data/sc_enriched.csv",
  "https://raw.githubusercontent.com/joyboseroy/imljd/main/data/parquet/sc_enriched.csv",
  "https://raw.githubusercontent.com/joyboseroy/imljd/main/sc_enriched.csv",
  "https://raw.githubusercontent.com/joyboseroy/imljd/main/data/sc_enriched.csv",
];

function timestamp() {
  return new Date().toISOString().slice(0, 19).replaceAll(":", "-");
}

function rawPath(filename: string) {
  return join(process.cwd(), "data", "raw", "imljd", filename);
}

function saveRaw(filename: string, value: string) {
  const path = rawPath(filename);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
  return path;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  const [headers, ...records] = rows;
  if (!headers) {
    throw new Error("CSV has no header row.");
  }

  return records.map((record) =>
    Object.fromEntries(
      headers.map((header, index) => [header.trim(), record[index] ?? ""]),
    ),
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function normalizeDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function yearFrom(value: string) {
  return value.match(/\b(19[5-9]\d|20\d{2})\b/)?.[1] ?? "";
}

function listValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSupremeCourtRecord(record: Record<string, unknown>) {
  const court = String(
    firstValue(record, ["court", "_court_name", "court_name", "courtName"]),
  ).toLowerCase();
  const source = String(firstValue(record, ["_source", "source"])).toLowerCase();
  const courtCode = String(firstValue(record, ["court_code", "courtCode"]));

  if (court.includes("high court") || source === "hc") {
    return false;
  }
  if (court.includes("supreme court") || source === "sc") {
    return true;
  }
  if (courtCode.startsWith("SC") || courtCode.toLowerCase() === "sc") {
    return true;
  }

  return false;
}

function inferCaseType(record: Record<string, unknown>, title: string) {
  const explicit = String(
    firstValue(record, ["case_type", "caseType", "type", "matter_type"]),
  ).trim();
  if (explicit) {
    return explicit;
  }

  const prefix = title.split(" of ")[0]?.trim();
  if (!prefix) {
    return "Matrimonial litigation";
  }
  if (/criminal|crl|cr\.?a/i.test(prefix)) {
    return "Criminal Appeal";
  }
  if (/slp/i.test(prefix)) {
    return "Special Leave Petition";
  }
  if (/transfer|t\.?p/i.test(prefix)) {
    return "Transfer Petition";
  }
  if (/civil|c\.?a/i.test(prefix)) {
    return "Civil Appeal";
  }

  return prefix.slice(0, 80);
}

function sourceUrl(record: Record<string, unknown>) {
  const direct = String(
    firstValue(record, ["sourceUrl", "source_url", "judgment_url", "url"]),
  ).trim();
  if (/^https?:\/\//.test(direct)) {
    return direct;
  }

  const pdf = String(firstValue(record, ["pdf_link", "pdfLink"])).trim();
  if (/^https?:\/\//.test(pdf)) {
    return pdf;
  }

  return GITHUB_URL;
}

function recordId(record: Record<string, unknown>, normalized: CsvRecord) {
  const caseId = String(firstValue(record, ["case_id", "caseId"])).trim();
  const fallback = normalized.caseNumber || normalized.diaryNumber;
  const value = caseId || fallback;

  return `imljd-${value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function subjectTagsFor(record: Record<string, unknown>) {
  const tags = new Set(["matrimonial", "imljd", "supreme court"]);
  for (const key of [
    "subjectTags",
    "subject_tags",
    "statutes",
    "outcome",
    "case_category",
    "label",
  ]) {
    for (const value of listValue(record[key])) {
      tags.add(value.toLowerCase());
    }
  }
  return [...tags].join("; ");
}

function normalizeRecord(raw: unknown): CsvRecord | null {
  const record = asRecord(raw);
  if (!isSupremeCourtRecord(record)) {
    return null;
  }

  const caseTitle = String(
    firstValue(record, ["title", "caseTitle", "case_title", "case_name"]),
  ).trim();
  const judgmentDate = normalizeDate(
    firstValue(record, ["decision_date", "decisionDate", "judgmentDate"]),
  );
  const judges = listValue(firstValue(record, ["judge", "judges", "bench"]));

  if (!caseTitle || !judgmentDate) {
    return null;
  }

  const registrationDate = normalizeDate(
    firstValue(record, ["date_of_registration", "registration_date"]),
  );
  const caseNumber = String(
    firstValue(record, ["case_id", "caseNumber", "case_number", "case_no_clean"]),
  ).trim();
  const normalized: CsvRecord = {
    id: "",
    caseTitle,
    caseNumber,
    diaryNumber: String(firstValue(record, ["diaryNumber", "diary_number", "cnr"])),
    diaryYear: yearFrom(registrationDate),
    caseType: String(firstValue(record, ["case_type", "caseType"]) || inferCaseType(record, caseTitle)),
    caseYear: yearFrom(registrationDate),
    decisionDate: judgmentDate,
    judgmentDate,
    uploadDate: "",
    disposalNature: String(firstValue(record, ["disposal_nature", "outcome"])),
    judges: judges.join("; "),
    authoringJudge: String(firstValue(record, ["author_judge", "authoring_judge"])),
    benchSize: judges.length > 0 ? String(judges.length) : "",
    subjectTags: subjectTagsFor(record),
    sourceName: SOURCE_NAME,
    sourceUrl: sourceUrl(record),
    confidence: "medium",
    sample: "false",
  };
  normalized.id = recordId(record, normalized);

  return normalized;
}

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function toCsv(records: CsvRecord[]) {
  return `${[
    CSV_HEADERS.join(","),
    ...records.map((record) =>
      CSV_HEADERS.map((header) => csvEscape(record[header])).join(","),
    ),
  ].join("\n")}\n`;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "text/csv, application/json;q=0.9, */*;q=0.1" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function loadFromRemoteCsv() {
  const errors: string[] = [];
  for (const url of REMOTE_CSV_URLS) {
    try {
      const text = await fetchText(url);
      if (!text.includes("decision_date") && !text.includes("title")) {
        throw new Error("remote file did not look like IMLJD CSV");
      }
      const path = saveRaw(`${timestamp()}-sc_enriched.csv`, text);
      return { records: parseCsv(text), source: url, rawPath: path };
    } catch (error) {
      errors.push(`${url}: ${String(error)}`);
    }
  }

  throw new Error(errors.join("\n"));
}

async function loadFromHuggingFaceRowsApi() {
  const records: unknown[] = [];
  let offset = 0;
  const length = 100;

  while (true) {
    const url = new URL("https://datasets-server.huggingface.co/rows");
    url.searchParams.set("dataset", "joyboseroy/imljd");
    url.searchParams.set("config", "sc");
    url.searchParams.set("split", "train");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("length", String(length));

    const text = await fetchText(url.toString());
    const json = JSON.parse(text) as {
      rows?: { row?: unknown }[];
      num_rows_total?: number;
    };
    const rows = json.rows ?? [];
    records.push(...rows.map((item) => item.row));

    if (rows.length < length || records.length >= (json.num_rows_total ?? 0)) {
      const path = saveRaw(
        `${timestamp()}-huggingface-rows.json`,
        `${JSON.stringify(records, null, 2)}\n`,
      );
      return {
        records,
        source: "https://datasets-server.huggingface.co/rows?dataset=joyboseroy/imljd&config=sc&split=train",
        rawPath: path,
      };
    }

    offset += length;
  }
}

function loadLocalFallback() {
  const jsonPath = join(process.cwd(), "data", "imports", "imljd.json");
  const csvPath = join(process.cwd(), "data", "imports", "imljd.csv");
  const nestedCsvPath = join(
    process.cwd(),
    "data",
    "imports",
    "imljd",
    "sc_enriched.csv",
  );
  const nestedParquetPath = join(
    process.cwd(),
    "data",
    "imports",
    "imljd",
    "sc_enriched.parquet",
  );

  if (existsSync(nestedCsvPath)) {
    const text = readFileSync(nestedCsvPath, "utf8");
    const path = saveRaw(`${timestamp()}-local-sc_enriched.csv`, text);
    return {
      records: parseCsv(text),
      source: "data/imports/imljd/sc_enriched.csv",
      rawPath: path,
    };
  }

  if (existsSync(nestedParquetPath)) {
    throw new Error(
      "data/imports/imljd/sc_enriched.parquet exists, but no parquet reader is installed. Export it to sc_enriched.csv and rerun import:imljd.",
    );
  }

  if (existsSync(jsonPath)) {
    const text = readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("data/imports/imljd.json must contain an array.");
    }
    const path = saveRaw(`${timestamp()}-local-imljd.json`, text);
    return { records: parsed, source: "data/imports/imljd.json", rawPath: path };
  }

  if (existsSync(csvPath)) {
    const text = readFileSync(csvPath, "utf8");
    const path = saveRaw(`${timestamp()}-local-imljd.csv`, text);
    return { records: parseCsv(text), source: "data/imports/imljd.csv", rawPath: path };
  }

  throw new Error("No local fallback found at data/imports/imljd.json or data/imports/imljd.csv.");
}

async function loadImljdSource() {
  const errors: string[] = [];
  try {
    return await loadFromRemoteCsv();
  } catch (error) {
    errors.push(`remote CSV failed:\n${String(error)}`);
  }

  try {
    return await loadFromHuggingFaceRowsApi();
  } catch (error) {
    errors.push(`Hugging Face rows API failed:\n${String(error)}`);
  }

  try {
    return loadLocalFallback();
  } catch (error) {
    errors.push(`local fallback failed:\n${String(error)}`);
  }

  throw new Error(errors.join("\n\n"));
}

async function importImljd() {
  const source = await loadImljdSource();
  const normalized = source.records
    .map((record) => normalizeRecord(record))
    .filter((record): record is CsvRecord => record !== null);

  if (normalized.length === 0) {
    throw new Error("No valid Supreme Court of India IMLJD records were found.");
  }

  const outputPath = join(process.cwd(), OUTPUT_PATH);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, toCsv(normalized));

  console.log(`OK: loaded IMLJD source from ${source.source}`);
  console.log(`OK: saved raw IMLJD source to ${source.rawPath}`);
  console.log(`OK: wrote ${normalized.length} Supreme Court of India records to ${OUTPUT_PATH}`);
  console.log(`OK: source repository ${GITHUB_URL}`);
  console.log("Next: run npm run data:build");
}

importImljd().catch((error) => {
  console.error("IMLJD import failed.");
  console.error(error);
  process.exit(1);
});

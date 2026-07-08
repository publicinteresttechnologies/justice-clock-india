import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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

type ImportOptions = {
  dryRun: boolean;
  limit: number;
  outputPath: string;
};

function parseArgs(argv: string[]): ImportOptions {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const outputArg = argv.find((arg) => arg.startsWith("--output="));
  const envLimit = process.env.ECOURTS_IMPORT_LIMIT;

  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(limitArg?.split("=")[1] ?? envLimit ?? 100),
    outputPath:
      outputArg?.slice("--output=".length) ?? "data/imports/judgments.csv",
  };
}

function requirePositiveLimit(limit: number) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Import limit must be a positive integer.");
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function extractRecordsFromResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  const record = asRecord(response);
  for (const key of ["data", "results", "judgments", "orders"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  throw new Error(
    "eCourtsIndia API response did not contain an array, data, results, judgments, or orders.",
  );
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

function listValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join("; ");
  }

  return String(value ?? "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("; ");
}

function normalizeDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashDate) {
    const [, day, month, year] = slashDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function normalizeYear(value: unknown) {
  const text = String(value ?? "").trim();
  const year = text.match(/\b(19[5-9]\d|20\d{2})\b/)?.[1];
  return year ?? "";
}

function deterministicId(record: CsvRecord) {
  const raw = [
    record.caseTitle,
    record.judgmentDate || record.decisionDate,
    record.caseNumber || record.sourceUrl,
  ]
    .join("|")
    .toLowerCase();

  if (!record.caseTitle || (!record.judgmentDate && !record.decisionDate)) {
    return "";
  }

  return `judgment-${createHash("sha256").update(raw).digest("hex").slice(0, 16)}`;
}

function courtValueFor(record: Record<string, unknown>) {
  return String(
    firstValue(record, [
      "court",
      "courtName",
      "court_name",
      "courtType",
      "court_type",
      "forum",
    ]),
  );
}

function assertSupremeCourtRecord(record: Record<string, unknown>) {
  const courtValue = courtValueFor(record).toLowerCase();
  if (!courtValue) {
    return;
  }

  if (!courtValue.includes("supreme court")) {
    throw new Error(
      `API record declares a non-Supreme Court court field: "${courtValueFor(record)}".`,
    );
  }
}

function sourceUrl(record: Record<string, unknown>, baseUrl: string) {
  const direct = firstValue(record, [
    "sourceUrl",
    "source_url",
    "url",
    "judgmentUrl",
    "judgment_url",
    "pdfUrl",
    "pdf_url",
  ]);

  if (direct) {
    return String(direct);
  }

  return baseUrl;
}

function normalizeApiRecord(raw: unknown, baseUrl: string): CsvRecord {
  const record = asRecord(raw);
  assertSupremeCourtRecord(record);

  const judges = listValue(
    firstValue(record, [
      "judges",
      "bench",
      "benchJudges",
      "bench_judges",
      "coram",
    ]),
  );

  const judgmentDate = normalizeDate(
    firstValue(record, [
      "judgmentDate",
      "judgment_date",
      "dateOfJudgment",
      "date_of_judgment",
      "orderDate",
      "order_date",
    ]),
  );
  const decisionDate = normalizeDate(
    firstValue(record, ["decisionDate", "decision_date", "disposedOn"]),
  );

  const normalized: CsvRecord = {
    id: String(firstValue(record, ["id", "judgmentId", "judgment_id"])),
    caseTitle: String(
      firstValue(record, [
        "caseTitle",
        "case_title",
        "title",
        "causeTitle",
        "cause_title",
      ]),
    ),
    caseNumber: String(
      firstValue(record, ["caseNumber", "case_number", "caseNo", "case_no"]),
    ),
    diaryNumber: String(
      firstValue(record, ["diaryNumber", "diary_number", "diaryNo", "diary_no"]),
    ),
    diaryYear: normalizeYear(firstValue(record, ["diaryYear", "diary_year"])),
    caseType: String(
      firstValue(record, ["caseType", "case_type", "type", "matterType"]) ||
        "Unclassified",
    ),
    caseYear: normalizeYear(firstValue(record, ["caseYear", "case_year"])),
    decisionDate,
    judgmentDate,
    uploadDate: normalizeDate(firstValue(record, ["uploadDate", "upload_date"])),
    disposalNature: String(
      firstValue(record, ["disposalNature", "disposal_nature", "disposition"]),
    ),
    judges,
    authoringJudge: String(
      firstValue(record, [
        "authoringJudge",
        "authoring_judge",
        "author",
        "authoredBy",
      ]),
    ),
    benchSize: String(
      firstValue(record, ["benchSize", "bench_size"]) ||
        judges.split(";").filter(Boolean).length ||
        "",
    ),
    subjectTags: listValue(
      firstValue(record, ["subjectTags", "subject_tags", "subjects", "topics"]),
    ),
    sourceName: "eCourtsIndia API",
    sourceUrl: sourceUrl(record, baseUrl),
    confidence: "medium",
    sample: "false",
  };

  normalized.id ||= deterministicId(normalized);
  validateNormalizedRecord(normalized);

  return normalized;
}

function validateNormalizedRecord(record: CsvRecord) {
  if (!record.caseTitle) {
    throw new Error("Normalized API record has no case title.");
  }

  if (!record.judgmentDate && !record.decisionDate) {
    throw new Error(
      `Normalized API record "${record.caseTitle}" has no judgment date or decision date.`,
    );
  }

  if (!record.judges) {
    throw new Error(`Normalized API record "${record.caseTitle}" has no judges.`);
  }
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function toCsv(records: CsvRecord[]) {
  const rows = [
    CSV_HEADERS.join(","),
    ...records.map((record) =>
      CSV_HEADERS.map((header) => csvEscape(record[header])).join(","),
    ),
  ];

  return `${rows.join("\n")}\n`;
}

function buildUrl(baseUrl: string, limit: number) {
  const url = new URL("judgments", `${baseUrl.replace(/\/$/, "")}/`);

  // TODO: Confirm the official eCourtsIndia endpoint and query parameter names.
  // The import is intentionally scoped to Supreme Court of India judgment
  // metadata only; do not broaden this to High Courts, District Courts,
  // tribunals, or all-India court data.
  url.searchParams.set("court", "supreme_court");
  url.searchParams.set("court_name", "Supreme Court of India");
  url.searchParams.set("type", "judgments");
  url.searchParams.set("limit", String(limit));

  return url;
}

function writeRawResponse(root: string, response: unknown) {
  const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const path = join(root, "data", "raw", "ecourts", `${timestamp}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(response, null, 2)}\n`);
  return path;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("eCourtsIndia API response was not valid JSON.");
  }
}

async function importEcourtsApi() {
  const options = parseArgs(process.argv.slice(2));
  requirePositiveLimit(options.limit);

  const apiKey = process.env.ECOURTS_API_KEY;
  const baseUrl =
    process.env.ECOURTS_API_BASE_URL ?? "https://ecourtsindia.com/api";
  const url = buildUrl(baseUrl, options.limit);

  if (options.dryRun) {
    console.log("Dry run enabled: no API request will be made.");
    console.log(`Planned URL: ${url.toString()}`);
    console.log(`Limit: ${options.limit}`);
    console.log(`Output CSV: ${options.outputPath}`);
    console.log("Raw response path: data/raw/ecourts/YYYY-MM-DDTHH-mm-ss.json");
    console.log("Scope: Supreme Court of India judgment metadata only.");
    return;
  }

  if (!apiKey) {
    throw new Error("Missing ECOURTS_API_KEY. Add it to the private environment.");
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`eCourtsIndia API request failed: ${response.status} ${response.statusText}`);
  }

  const json = await readJsonResponse(response);
  const root = process.cwd();
  const rawPath = writeRawResponse(root, json);
  const extracted = extractRecordsFromResponse(json);
  const normalized = extracted
    .map((record) => normalizeApiRecord(record, baseUrl))
    .slice(0, options.limit);

  if (normalized.length === 0) {
    throw new Error(
      "No Supreme Court of India judgment records were found in the API response.",
    );
  }

  console.log(`OK: saved raw eCourtsIndia response to ${rawPath}`);
  console.log(`OK: normalized ${normalized.length} Supreme Court judgment records`);

  if (options.dryRun) {
    console.log("Dry run enabled: data/imports/judgments.csv was not written.");
    return;
  }

  const outputPath = join(root, options.outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, toCsv(normalized));
  console.log(`OK: wrote normalized import CSV to ${options.outputPath}`);
  console.log("Next: run npm run data:build or npm run data.");
}

importEcourtsApi().catch((error) => {
  console.error("eCourtsIndia API import failed.");
  console.error(error);
  process.exit(1);
});

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const OUTPUT_PATH = "data/imports/judgments.csv";
const RAW_DIR = "data/raw/hf-supreme-court-judgments";
const HF_DATASET_URL =
  "https://huggingface.co/datasets/labofsahil/Indian-Supreme-Court-Judgments";
const HF_SOURCE_NAME = "Hugging Face Indian Supreme Court Judgments mirror";

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

function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function yearRange() {
  const currentYear = new Date().getUTCFullYear();
  const fromYear = Number(argValue("from-year") ?? "1950");
  const toYear = Number(argValue("to-year") ?? String(currentYear));
  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear) || fromYear > toYear) {
    throw new Error("Use a valid --from-year=YYYY and --to-year=YYYY range.");
  }
  return { fromYear, toYear };
}

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
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
    return [];
  }

  return records.map((record) =>
    Object.fromEntries(
      headers.map((header, index) => [header.trim(), record[index] ?? ""]),
    ) as Partial<CsvRecord>,
  );
}

function readExistingImports() {
  if (!existsSync(OUTPUT_PATH)) {
    return [] as CsvRecord[];
  }
  return parseCsv(readFileSync(OUTPUT_PATH, "utf8")).map((record) => {
    const normalized = Object.fromEntries(
      CSV_HEADERS.map((header) => [header, String(record[header] ?? "")]),
    ) as CsvRecord;
    return normalized;
  });
}

function writeCsv(records: CsvRecord[]) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const csv = [
    CSV_HEADERS.join(","),
    ...records.map((record) =>
      CSV_HEADERS.map((header) => csvEscape(record[header])).join(","),
    ),
  ].join("\n");
  writeFileSync(OUTPUT_PATH, `${csv}\n`);
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(value: string) {
  const match = value.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (!match) {
    return "";
  }
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function detailField(html: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escaped}\\s*:?<\\/span>\\s*<font[^>]*>([\\s\\S]*?)<\\/font>`,
    "i",
  );
  return decodeHtml(html.match(pattern)?.[1] ?? "");
}

function titleFromHtml(html: string) {
  const strong = html.match(/<button[\s\S]*?<strong>([\s\S]*?)<\/strong>\s*-/i)?.[1];
  const aria = html.match(/aria-label="([^"]+?)\s+pdf"/i)?.[1];
  return decodeHtml(strong ?? aria ?? "").replace(/\s+versus\s+/i, " versus ");
}

function coramFromHtml(html: string) {
  const raw = html.match(/Coram\s*:\s*([\s\S]*?)<\/strong>/i)?.[1] ?? "";
  const cleaned = decodeHtml(raw.replace(/<sup[\s\S]*?<\/sup>/gi, ""));
  return cleaned
    .split(/\s*,\s*/)
    .map((judge) => judge.trim())
    .filter(Boolean);
}

function authorFromHtml(html: string) {
  const raw = html.match(/Coram\s*:\s*([\s\S]*?)<\/strong>/i)?.[1] ?? "";
  const beforeAuthor = raw.match(/([^,<>]+)<sup[^>]+data-tooltip=["']Author["']/i)?.[1];
  return beforeAuthor ? decodeHtml(beforeAuthor) : "";
}

function caseTypeFromCaseNumber(caseNumber: string) {
  const text = caseNumber.toUpperCase();
  if (text.includes("CRIMINAL APPEAL")) return "Criminal Appeal";
  if (text.includes("CIVIL APPEAL")) return "Civil Appeal";
  if (text.includes("SLP")) return text.includes("CRIMINAL") ? "SLP Criminal" : "SLP Civil";
  if (text.includes("WRIT")) return "Writ Petition";
  if (text.includes("TRANSFER")) return "Transfer Petition";
  if (text.includes("REVIEW")) return "Review Petition";
  if (text.includes("CONTEMPT")) return "Contempt Petition";
  return "Supreme Court judgment";
}

function caseYearFrom(caseNumber: string, decisionDate: string) {
  return (
    caseNumber.match(/\b(19[5-9]\d|20\d{2})\b/)?.[1] ??
    decisionDate.slice(0, 4)
  );
}

function normalizeMetadataRecord(raw: Record<string, unknown>): CsvRecord | null {
  const html = String(raw.raw_html ?? "");
  const pathValue = String(raw.path ?? "").trim();
  const title = titleFromHtml(html);
  const judges = coramFromHtml(html);
  const decisionDate = normalizeDate(detailField(html, "Decision Date"));
  const caseNumber = detailField(html, "Case No");
  const disposalNature =
    detailField(html, "Disposal Nature") || detailField(html, "Direction Issue");
  const benchSizeText = detailField(html, "Bench");
  const benchSize = benchSizeText.match(/\d+/)?.[0] ?? String(judges.length || "");
  const citation = decodeHtml(html.match(/<span class='escrText'>([\s\S]*?)<\/span>/i)?.[1] ?? "");
  const neutralCitation = String(raw.nc_display ?? "").trim();

  if (!pathValue || !title || !decisionDate || judges.length === 0) {
    return null;
  }

  const caseType = caseTypeFromCaseNumber(caseNumber);
  return {
    id: `hf-sc-${pathValue.replace(/[^A-Za-z0-9]+/g, "-")}`,
    caseTitle: title,
    caseNumber: [caseNumber, neutralCitation, citation].filter(Boolean).join(" | "),
    diaryNumber: "",
    diaryYear: "",
    caseType,
    caseYear: caseYearFrom(caseNumber, decisionDate),
    decisionDate,
    judgmentDate: decisionDate,
    uploadDate: "",
    disposalNature,
    judges: judges.join("; "),
    authoringJudge: authorFromHtml(html),
    benchSize,
    subjectTags: [
      "supreme court",
      "escr",
      "hugging face mirror",
      caseType.toLowerCase(),
    ].join("; "),
    sourceName: HF_SOURCE_NAME,
    sourceUrl: HF_DATASET_URL,
    confidence: "medium",
    sample: "false",
  };
}

async function download(url: string, path: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "justice-clock-india-data-import" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

async function importYear(year: number) {
  const yearDir = join(RAW_DIR, String(year));
  const tarPath = join(yearDir, "metadata.tar");
  const extractDir = join(yearDir, "metadata");
  const url = `${HF_DATASET_URL}/resolve/main/metadata/tar/year=${year}/metadata.tar`;

  if (!existsSync(tarPath)) {
    await download(url, tarPath);
  }

  rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });
  execFileSync("tar", ["-xf", tarPath, "-C", extractDir], { stdio: "ignore" });

  const records: CsvRecord[] = [];
  for (const file of readdirSync(extractDir).filter((name) => name.endsWith(".json"))) {
    const raw = JSON.parse(readFileSync(join(extractDir, file), "utf8")) as Record<
      string,
      unknown
    >;
    const record = normalizeMetadataRecord(raw);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

function dedupeKey(record: CsvRecord) {
  return [
    record.caseTitle.toLowerCase().replace(/\s+/g, " ").trim(),
    record.judgmentDate || record.decisionDate,
    record.caseNumber.toLowerCase().replace(/\s+/g, " ").trim(),
  ].join("|");
}

async function main() {
  const { fromYear, toYear } = yearRange();
  const existing = readExistingImports();
  const byKey = new Map<string, CsvRecord>();
  const byId = new Map<string, CsvRecord>();

  for (const record of existing) {
    byKey.set(dedupeKey(record), record);
    byId.set(record.id, record);
  }

  let imported = 0;
  const errors: string[] = [];
  for (let year = fromYear; year <= toYear; year += 1) {
    try {
      const records = await importYear(year);
      imported += records.length;
      for (const record of records) {
        if (!byId.has(record.id) && !byKey.has(dedupeKey(record))) {
          byId.set(record.id, record);
          byKey.set(dedupeKey(record), record);
        }
      }
      console.log(`OK: imported ${records.length} Supreme Court metadata records for ${year}`);
    } catch (error) {
      errors.push(`${year}: ${String(error)}`);
      console.warn(`WARN: skipped ${year}: ${String(error)}`);
    }
  }

  const merged = [...byId.values()].sort((a, b) =>
    (a.judgmentDate || a.decisionDate).localeCompare(b.judgmentDate || b.decisionDate),
  );
  writeCsv(merged);

  console.log(`OK: scanned ${imported} records from ${HF_SOURCE_NAME}`);
  console.log(`OK: wrote ${merged.length} total normalized judgment records to ${OUTPUT_PATH}`);
  if (errors.length > 0) {
    console.log(`WARN: ${errors.length} yearly source archives were unavailable or malformed.`);
  }
}

main().catch((error) => {
  console.error("Supreme Court source import failed.");
  console.error(error);
  process.exit(1);
});

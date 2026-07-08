import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  courtSnapshotSchema,
  judgmentRecordSchema,
  judgmentsSchema,
  type Confidence,
  type CourtSnapshot,
  type JudgmentRecord,
  type SourceKind,
} from "../../src/lib/schemas";

type SourceData = {
  courtSnapshot: CourtSnapshot;
  courtSnapshotSource: {
    mode: SourceKind;
    path: string;
  };
  judgments: JudgmentRecord[];
  judgmentsSource: {
    mode: SourceKind;
    path: string;
  };
};

const importPaths = {
  courtSnapshot: "data/imports/court-snapshot.json",
  judgmentsCsv: "data/imports/judgments.csv",
  judgmentsJson: "data/imports/judgments.json",
};

const samplePaths = {
  courtSnapshot: "data/seed/court-snapshot.sample.json",
  judgments: "data/seed/judgments.sample.json",
};

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function emptyToNull(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text === "" ? null : text;
}

function parseInteger(value: unknown) {
  const clean = emptyToNull(value);
  if (clean === null) {
    return null;
  }

  const parsed = Number(clean);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected integer value, received "${clean}".`);
  }

  return parsed;
}

function splitList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const clean = emptyToNull(value);
  if (clean === null) {
    return [];
  }

  return String(clean)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDate(value: unknown) {
  const clean = emptyToNull(value);
  if (clean === null) {
    return null;
  }

  const text = String(clean);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  throw new Error(`Unsupported date format "${text}". Use YYYY-MM-DD.`);
}

function parseBoolean(value: unknown, defaultValue: boolean) {
  const clean = emptyToNull(value);
  if (clean === null) {
    return defaultValue;
  }

  const text = String(clean).toLowerCase();
  if (["true", "1", "yes", "y"].includes(text)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(text)) {
    return false;
  }

  throw new Error(`Expected boolean value, received "${clean}".`);
}

function normalizeConfidence(value: unknown): Confidence {
  const clean = emptyToNull(value);
  if (clean === null) {
    return "medium";
  }

  return String(clean).trim() as Confidence;
}

function generatedId(record: Record<string, unknown>) {
  const caseTitle = emptyToNull(record.caseTitle);
  const date = emptyToNull(record.judgmentDate) ?? emptyToNull(record.decisionDate);
  const caseNumber = emptyToNull(record.caseNumber);

  if (!caseTitle || !date) {
    throw new Error(
      "Missing id and insufficient fields to generate one. Provide id, or caseTitle plus judgmentDate/decisionDate.",
    );
  }

  const raw = [caseTitle, date, caseNumber ?? ""].join("|").toLowerCase();
  return `judgment-${createHash("sha256").update(raw).digest("hex").slice(0, 16)}`;
}

function normalizeJudgment(
  raw: Record<string, unknown>,
  sourceKind: SourceKind,
): JudgmentRecord {
  const judges = splitList(raw.judges);
  const benchSize = parseInteger(raw.benchSize) ?? judges.length;

  const normalized = {
    id: String(emptyToNull(raw.id) ?? generatedId(raw)),
    caseTitle: String(emptyToNull(raw.caseTitle) ?? ""),
    caseNumber: emptyToNull(raw.caseNumber),
    diaryNumber: emptyToNull(raw.diaryNumber),
    diaryYear: parseInteger(raw.diaryYear),
    caseType: String(emptyToNull(raw.caseType) ?? "Unclassified"),
    caseYear: parseInteger(raw.caseYear),
    decisionDate: normalizeDate(raw.decisionDate),
    judgmentDate: normalizeDate(raw.judgmentDate),
    uploadDate: normalizeDate(raw.uploadDate),
    disposalNature: emptyToNull(raw.disposalNature),
    judges,
    authoringJudge: emptyToNull(raw.authoringJudge),
    benchSize,
    subjectTags: splitList(raw.subjectTags),
    sourceName: String(
      emptyToNull(raw.sourceName) ?? "Supreme Court judgment metadata import",
    ),
    sourceUrl: emptyToNull(raw.sourceUrl),
    confidence: normalizeConfidence(raw.confidence),
    sample: parseBoolean(raw.sample, sourceKind === "sample"),
  };

  return judgmentRecordSchema.parse(normalized);
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
  if (!headers || headers.length === 0) {
    throw new Error("CSV file has no header row.");
  }

  return records.map((record) =>
    Object.fromEntries(
      headers.map((header, index) => [header.trim(), record[index] ?? ""]),
    ),
  );
}

function loadJudgmentImport(root: string) {
  const jsonPath = join(root, importPaths.judgmentsJson);
  const csvPath = join(root, importPaths.judgmentsCsv);
  const hasJson = existsSync(jsonPath);
  const hasCsv = existsSync(csvPath);

  if (!hasJson && !hasCsv) {
    return null;
  }

  const records: JudgmentRecord[] = [];
  const sourcePaths: string[] = [];

  if (hasJson) {
    const raw = readJson(jsonPath);
    if (!Array.isArray(raw)) {
      throw new Error(`${importPaths.judgmentsJson} must contain an array.`);
    }
    records.push(
      ...raw.map((record) =>
        normalizeJudgment(record as Record<string, unknown>, "import"),
      ),
    );
    sourcePaths.push(importPaths.judgmentsJson);
  }

  if (hasCsv) {
    const rawRows = parseCsv(readFileSync(csvPath, "utf8"));
    records.push(
      ...rawRows.map((record) => normalizeJudgment(record, "import")),
    );
    sourcePaths.push(importPaths.judgmentsCsv);
  }

  return {
    records: judgmentsSchema.parse(records),
    path: sourcePaths.join(", "),
  };
}

function loadSampleJudgments(root: string) {
  const sample = readJson(join(root, samplePaths.judgments));
  if (!Array.isArray(sample)) {
    throw new Error(`${samplePaths.judgments} must contain an array.`);
  }

  return judgmentsSchema.parse(
    sample.map((record) =>
      normalizeJudgment(record as Record<string, unknown>, "sample"),
    ),
  );
}

function loadCourtSnapshot(root: string) {
  const importPath = join(root, importPaths.courtSnapshot);
  if (existsSync(importPath)) {
    return {
      record: courtSnapshotSchema.parse(readJson(importPath)),
      source: {
        mode: "import" as const,
        path: importPaths.courtSnapshot,
      },
    };
  }

  return {
    record: courtSnapshotSchema.parse(
      readJson(join(root, samplePaths.courtSnapshot)),
    ),
    source: {
      mode: "sample" as const,
      path: samplePaths.courtSnapshot,
    },
  };
}

export function loadSourceData(root = process.cwd()): SourceData {
  const courtSnapshot = loadCourtSnapshot(root);
  const judgmentImport = loadJudgmentImport(root);

  if (judgmentImport) {
    return {
      courtSnapshot: courtSnapshot.record,
      courtSnapshotSource: courtSnapshot.source,
      judgments: judgmentImport.records,
      judgmentsSource: {
        mode: "import",
        path: judgmentImport.path,
      },
    };
  }

  return {
    courtSnapshot: courtSnapshot.record,
    courtSnapshotSource: courtSnapshot.source,
    judgments: loadSampleJudgments(root),
    judgmentsSource: {
      mode: "sample",
      path: samplePaths.judgments,
    },
  };
}

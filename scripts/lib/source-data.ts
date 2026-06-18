import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  courtSnapshotSchema,
  judgmentRecordSchema,
  type CourtSnapshot,
  type JudgmentRecord,
} from "../../src/lib/schemas";

type LoadedSource<T> = {
  data: T;
  sourcePath: string;
  sourceType: "import" | "sample";
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function splitList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clean(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeCsvJudgment(row: Record<string, string>, index: number): JudgmentRecord {
  const normalized = {
    id: clean(row.id) ?? `imported-judgment-${String(index + 1).padStart(5, "0")}`,
    caseTitle: clean(row.caseTitle) ?? clean(row.title) ?? "Untitled judgment",
    caseNumber: clean(row.caseNumber),
    diaryNumber: clean(row.diaryNumber),
    diaryYear: toNumber(row.diaryYear),
    caseType: clean(row.caseType),
    caseYear: toNumber(row.caseYear),
    decisionDate: clean(row.decisionDate),
    judgmentDate: clean(row.judgmentDate),
    uploadDate: clean(row.uploadDate),
    disposalNature: clean(row.disposalNature),
    judges: splitList(row.judges),
    authoringJudge: clean(row.authoringJudge),
    benchSize: toNumber(row.benchSize),
    subjectTags: splitList(row.subjectTags),
    sourceName: clean(row.sourceName) ?? "Imported Judgment Metadata",
    sourceUrl: clean(row.sourceUrl),
    confidence: clean(row.confidence) ?? "medium",
    sample: row.sample === "true" ? true : undefined,
  };

  return judgmentRecordSchema.parse(normalized);
}

export async function loadCourtSnapshot(root: string): Promise<LoadedSource<CourtSnapshot>> {
  const importPath = path.join(root, "data/imports/court-snapshot.json");
  const samplePath = path.join(root, "data/seed/court-snapshot.sample.json");
  const sourcePath = (await fileExists(importPath)) ? importPath : samplePath;
  const sourceType = sourcePath === importPath ? "import" : "sample";

  return {
    data: courtSnapshotSchema.parse(await readJson<unknown>(sourcePath)),
    sourcePath,
    sourceType,
  };
}

export async function loadJudgments(root: string): Promise<LoadedSource<JudgmentRecord[]>> {
  const importJsonPath = path.join(root, "data/imports/judgments.json");
  const importCsvPath = path.join(root, "data/imports/judgments.csv");
  const samplePath = path.join(root, "data/seed/judgments.sample.json");

  if (await fileExists(importJsonPath)) {
    const input = await readJson<unknown>(importJsonPath);
    if (!Array.isArray(input)) {
      throw new Error("data/imports/judgments.json must contain an array.");
    }

    return {
      data: input.map((record) => judgmentRecordSchema.parse(record)),
      sourcePath: importJsonPath,
      sourceType: "import",
    };
  }

  if (await fileExists(importCsvPath)) {
    const raw = await readFile(importCsvPath, "utf8");
    const rows = parseCsv(raw);

    if (rows.length > 0) {
      return {
        data: rows.map((row, index) => normalizeCsvJudgment(row, index)),
        sourcePath: importCsvPath,
        sourceType: "import",
      };
    }
  }

  const sample = await readJson<unknown>(samplePath);
  if (!Array.isArray(sample)) {
    throw new Error("data/seed/judgments.sample.json must contain an array.");
  }

  return {
    data: sample.map((record) => judgmentRecordSchema.parse(record)),
    sourcePath: samplePath,
    sourceType: "sample",
  };
}

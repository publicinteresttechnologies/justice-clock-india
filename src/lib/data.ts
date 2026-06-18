import justiceClockDataRaw from "../../public/data/justice-clock-data.json";
import type {
  CaseTypeMetric,
  ConfidenceLevel,
  CourtSnapshot,
  JudgeProfile,
  JudgmentRecord,
} from "./schemas";

type CourtClock = CourtSnapshot & {
  clearanceRate: number | null;
};

type JusticeClockDataset = {
  metadata: Record<string, any>;
  courtClock: CourtClock;
  caseTypes: CaseTypeMetric[];
  judges: JudgeProfile[];
  judgments: JudgmentRecord[];
};

export const justiceClockData = justiceClockDataRaw as JusticeClockDataset;
export const courtClock = justiceClockData.courtClock;
export const caseTypes = justiceClockData.caseTypes;
export const judges = justiceClockData.judges;
export const judgments = justiceClockData.judgments;
export const dataMetadata = justiceClockData.metadata;

export function getCaseTypeBySlug(slug: string) {
  return caseTypes.find((caseType) => caseType.slug === slug) ?? null;
}

export function getJudgeBySlug(slug: string) {
  return judges.find((judge) => judge.slug === slug) ?? null;
}

export function formatYears(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not enough data";
  return `${value} years`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatSourceMode(value?: string) {
  return value === "import" ? "Import" : "Sample";
}

export function confidenceOrExperimental(value?: ConfidenceLevel) {
  return value ?? "experimental";
}

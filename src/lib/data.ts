import courtClockRaw from "../../public/data/court-clock.json";
import caseTypesRaw from "../../public/data/case-types.json";
import judgesRaw from "../../public/data/judges.json";
import type { CaseTypeMetric, ConfidenceLevel, CourtSnapshot, JudgeProfile } from "./schemas";

type CourtClock = CourtSnapshot & {
  clearanceRate: number | null;
};

export const courtClock = courtClockRaw as CourtClock;
export const caseTypes = caseTypesRaw as CaseTypeMetric[];
export const judges = judgesRaw as JudgeProfile[];

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

export function confidenceOrExperimental(value?: ConfidenceLevel) {
  return value ?? "experimental";
}

import type { JudgmentRecord } from "./schemas";

export function safeClearanceRate(
  disposed: number | null | undefined,
  instituted: number | null | undefined,
): number | null {
  if (!instituted || disposed === null || disposed === undefined || instituted <= 0) {
    return null;
  }

  return (disposed / instituted) * 100;
}

export function median(numbers: number[]): number | null {
  if (numbers.length === 0) {
    return null;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[midpoint];
  }

  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

export function percentile(numbers: number[], p: number): number | null {
  if (numbers.length === 0) {
    return null;
  }

  if (p <= 0) {
    return Math.min(...numbers);
  }

  if (p >= 100) {
    return Math.max(...numbers);
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function getYear(dateString: string | null | undefined): number | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getUTCFullYear();
}

export function approximateCaseAgeYears(
  record: Pick<
    JudgmentRecord,
    "diaryYear" | "caseYear" | "decisionDate" | "judgmentDate"
  >,
): number | null {
  const approxStartYear = record.diaryYear ?? record.caseYear;
  const decisionYear = getYear(record.decisionDate ?? record.judgmentDate);

  if (!approxStartYear || !decisionYear) {
    return null;
  }

  return decisionYear - approxStartYear;
}

export function isOlderThan5Years(record: JudgmentRecord): boolean {
  const age = approximateCaseAgeYears(record);
  return age !== null && age > 5;
}

export function isOlderThan10Years(record: JudgmentRecord): boolean {
  const age = approximateCaseAgeYears(record);
  return age !== null && age > 10;
}

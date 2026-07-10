import type { Confidence, JudgmentRecord } from "./schemas";

const confidenceRank: Record<Confidence, number> = {
  high: 5,
  "medium-high": 4,
  medium: 3,
  low: 2,
  experimental: 1,
};

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

export function getJudgmentYear(
  record: Pick<JudgmentRecord, "decisionDate" | "judgmentDate">,
): number | null {
  return getYear(record.decisionDate ?? record.judgmentDate);
}

export function weakestConfidence(
  records: Pick<JudgmentRecord, "confidence">[],
): Confidence {
  if (records.length === 0) {
    return "experimental";
  }

  return records.reduce<Confidence>((weakest, record) =>
    confidenceRank[record.confidence] < confidenceRank[weakest]
      ? record.confidence
      : weakest,
  records[0].confidence);
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

export type DelayEstimate = {
  id: string;
  caseTitle: string;
  judgmentYear: number;
  estimatedStartYear: number;
  estimatedDelayYears: number;
  confidence: Confidence;
  startSignal: string;
};

export type DelayAuditRow = {
  id: string;
  caseTitle: string;
  judgmentYear: number | null;
  startSignal: string;
  estimatedStartYear: number | null;
  status: "usable" | "excluded";
};

export function delayStartSignal(record: JudgmentRecord): {
  year: number;
  confidence: Confidence;
  signal: string;
} | null {
  if (record.diaryYear) {
    return { year: record.diaryYear, confidence: "medium", signal: "diaryYear" };
  }
  if (record.caseYear) {
    return { year: record.caseYear, confidence: "medium", signal: "caseYear" };
  }
  return null;
}

export function computeDelayEstimates(judgments: JudgmentRecord[]) {
  const auditRows: DelayAuditRow[] = [];
  const estimates: DelayEstimate[] = [];

  for (const record of judgments) {
    const signal = delayStartSignal(record);
    const endYear = getJudgmentYear(record);
    const estimatedDelay = approximateCaseAgeYears(record);
    const usable =
      signal !== null &&
      endYear !== null &&
      estimatedDelay !== null &&
      estimatedDelay >= 0 &&
      estimatedDelay <= 80;

    auditRows.push({
      id: record.id,
      caseTitle: record.caseTitle,
      judgmentYear: endYear,
      startSignal: signal?.signal ?? "none",
      estimatedStartYear: signal?.year ?? null,
      status: usable ? "usable" : "excluded",
    });

    if (usable) {
      estimates.push({
        id: record.id,
        caseTitle: record.caseTitle,
        judgmentYear: endYear,
        estimatedStartYear: signal.year,
        estimatedDelayYears: estimatedDelay,
        confidence: signal.confidence,
        startSignal: signal.signal,
      });
    }
  }

  return { auditRows, estimates };
}

export function delayConfidenceBreakdown(estimates: DelayEstimate[]) {
  const breakdown: Record<Confidence, number> = {
    high: 0,
    "medium-high": 0,
    medium: 0,
    low: 0,
    experimental: 0,
  };

  for (const estimate of estimates) {
    breakdown[estimate.confidence] += 1;
  }

  return breakdown;
}

export function buildDelaySummaryFromJudgments(
  judgments: JudgmentRecord[],
  source: string,
  status: "sample" | "generated",
) {
  const { estimates } = computeDelayEstimates(judgments);
  const delays = estimates.map((row) => row.estimatedDelayYears);

  return {
    generatedAt: new Date().toISOString(),
    status,
    source,
    recordsAnalyzed: judgments.length,
    recordsUsable: estimates.length,
    recordsExcluded: judgments.length - estimates.length,
    confidenceBreakdown: delayConfidenceBreakdown(estimates),
    medianDelayYears: median(delays),
    p75DelayYears: percentile(delays, 75),
    p90DelayYears: percentile(delays, 90),
    longestDelays: [...estimates]
      .sort((a, b) => b.estimatedDelayYears - a.estimatedDelayYears)
      .slice(0, 20),
    limitations: [
      "This is historical estimated time-to-judgment, not exact delay of all cases.",
      "Records are excluded when no credible filing, registration, diary, or structured case-year signal is available.",
    ],
  };
}

export function isOlderThan5Years(record: JudgmentRecord): boolean {
  const age = approximateCaseAgeYears(record);
  return age !== null && age > 5;
}

export function isOlderThan10Years(record: JudgmentRecord): boolean {
  const age = approximateCaseAgeYears(record);
  return age !== null && age > 10;
}

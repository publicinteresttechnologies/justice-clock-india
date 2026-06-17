import type {
  CaseTypeMetric,
  CourtSnapshot,
  JudgeProfile,
  JudgmentRecord,
} from "./schemas";

export function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function safeClearanceRate(disposed?: number, instituted?: number) {
  if (!instituted || instituted <= 0 || disposed === undefined) return null;
  return roundOne((disposed / instituted) * 100);
}

export function percentile(values: number[], p: number) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  if (clean.length === 1) return roundOne(clean[0]);

  const index = (p / 100) * (clean.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const result = clean[lower] * (1 - weight) + clean[upper] * weight;

  return roundOne(result);
}

export function median(values: number[]) {
  return percentile(values, 50);
}

export function getYear(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear();
}

export function approximateCaseAgeYears(record: JudgmentRecord) {
  const startYear = record.diaryYear ?? record.caseYear;
  const decisionYear = getYear(record.decisionDate ?? record.judgmentDate);

  if (!startYear || !decisionYear) return null;

  const age = decisionYear - startYear;
  return age >= 0 ? age : null;
}

export function isOlderThan5Years(record: JudgmentRecord) {
  const age = approximateCaseAgeYears(record);
  return age !== null && age >= 5;
}

export function isOlderThan10Years(record: JudgmentRecord) {
  const age = approximateCaseAgeYears(record);
  return age !== null && age >= 10;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function countBy<T extends string | number>(items: T[]) {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

function toCountArray<T extends string | number>(counts: Map<T, number>) {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

export function buildCourtClock(snapshot: CourtSnapshot) {
  return {
    ...snapshot,
    clearanceRate: safeClearanceRate(snapshot.disposedThisMonth, snapshot.institutedThisMonth),
  };
}

export function buildCaseTypeMetrics(records: JudgmentRecord[]): CaseTypeMetric[] {
  const grouped = new Map<string, JudgmentRecord[]>();

  for (const record of records) {
    const caseType = record.caseType ?? "Unknown";
    grouped.set(caseType, [...(grouped.get(caseType) ?? []), record]);
  }

  return [...grouped.entries()]
    .map(([caseType, group]) => {
      const ages = group
        .map(approximateCaseAgeYears)
        .filter((age): age is number => age !== null);

      const years = group
        .map((record) => getYear(record.decisionDate ?? record.judgmentDate))
        .filter((year): year is number => year !== null);

      const judgmentsByYear = toCountArray(countBy(years)).map(({ key, count }) => ({
        year: Number(key),
        count,
      }));

      return {
        slug: slugify(caseType),
        caseType,
        sampleSize: group.length,
        medianCaseAgeYears: median(ages),
        p25CaseAgeYears: percentile(ages, 25),
        p75CaseAgeYears: percentile(ages, 75),
        p90CaseAgeYears: percentile(ages, 90),
        oldestCaseAgeYears: ages.length ? Math.max(...ages) : null,
        judgmentsByYear,
        confidence: "experimental" as const,
        caveat:
          "This measures the gap between case/diary year and judgment year where exact filing-to-disposal dates are not available. It is an approximation, not a prediction for your case.",
        sources: [{ name: "Sample Judgment Metadata" }],
        sample: group.some((record) => record.sample),
      };
    })
    .sort((a, b) => a.caseType.localeCompare(b.caseType));
}

export function buildJudgeProfiles(records: JudgmentRecord[]): JudgeProfile[] {
  const judgeNames = new Set<string>();
  for (const record of records) {
    for (const judge of record.judges) judgeNames.add(judge);
  }

  return [...judgeNames]
    .sort((a, b) => a.localeCompare(b))
    .map((judgeName) => {
      const associated = records.filter((record) => record.judges.includes(judgeName));
      const authored = associated.filter((record) => record.authoringJudge === judgeName);
      const ages = associated
        .map(approximateCaseAgeYears)
        .filter((age): age is number => age !== null);
      const years = associated
        .map((record) => getYear(record.decisionDate ?? record.judgmentDate))
        .filter((year): year is number => year !== null);
      const caseTypes = associated.map((record) => record.caseType ?? "Unknown");
      const subjects = associated.flatMap((record) => record.subjectTags ?? ["Unknown"]);
      const benchSizes = associated.map((record) => `${record.benchSize ?? "Unknown"}-judge`);

      const caseTypeCounts = toCountArray(countBy(caseTypes));
      const subjectCounts = toCountArray(countBy(subjects));
      const totalAssociated = associated.length || 1;

      return {
        slug: slugify(judgeName),
        judgeName,
        authoredJudgments: authored.length,
        benchAssociatedJudgments: associated.length,
        judgmentsByYear: toCountArray(countBy(years)).map(({ key, count }) => ({
          year: Number(key),
          count,
        })),
        caseTypeMix: caseTypeCounts.map(({ key, count }) => ({
          caseType: String(key),
          count,
          percentage: roundOne((count / totalAssociated) * 100),
        })),
        subjectMix: subjectCounts.map(({ key, count }) => ({
          subject: String(key),
          count,
          percentage: roundOne((count / totalAssociated) * 100),
        })),
        benchSizeProfile: toCountArray(countBy(benchSizes)).map(({ key, count }) => ({
          benchSize: String(key),
          count,
        })),
        medianCaseAgeYears: median(ages),
        casesOlderThan5Years: associated.filter(isOlderThan5Years).length,
        casesOlderThan10Years: associated.filter(isOlderThan10Years).length,
        oldestCaseAgeYears: ages.length ? Math.max(...ages) : null,
        confidence: "experimental" as const,
        attributionWarning:
          "This is not a performance rating. It is a public metadata profile based on available judgment records.",
        caveat:
          "Bench-associated metrics are not direct blame metrics. Case-age figures are approximate unless exact filing-to-disposal data is available.",
        sources: [{ name: "Sample Judgment Metadata" }],
        sample: associated.some((record) => record.sample),
      };
    });
}

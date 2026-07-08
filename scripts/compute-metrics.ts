import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  caseTypeMetricsSchema,
  courtClockSchema,
  justiceClockDatasetSchema,
  judgeProfilesSchema,
  siteSummarySchema,
  sourceCardsSchema,
  type Confidence,
  type CourtSnapshot,
  type JudgmentRecord,
  type Source,
} from "../src/lib/schemas";
import {
  approximateCaseAgeYears,
  isOlderThan10Years,
  isOlderThan5Years,
  median,
  percentile,
  safeClearanceRate,
} from "../src/lib/metrics";
import { loadSourceData } from "./lib/source-data";

const CASE_AGE_CAVEAT =
  "This measures the gap between case/diary year and judgment year where exact filing-to-disposal dates are not available. It is an approximation, not a prediction for your case.";
const JUDGE_CAVEAT =
  "This is not a performance rating. It is a public metadata profile based on available judgment records.";
const ATTRIBUTION_WARNING =
  "Bench-associated counts show participation on a bench, not individual responsibility for delay or outcome.";
const IMLJD_SOURCE_NAME = "IMLJD open dataset";
const HF_SC_SOURCE_NAME = "Hugging Face Indian Supreme Court Judgments mirror";
const IMLJD_DATASET_SCOPE = {
  name: "IMLJD Supreme Court subset" as const,
  court: "Supreme Court of India" as const,
  coverage: "Subject-specific matrimonial/criminal-family litigation subset" as const,
  years: "2000-2024" as const,
  fullCourtCoverage: false as const,
};
const MIXED_SC_DATASET_SCOPE = {
  name: "Mixed Supreme Court judgment metadata imports" as const,
  court: "Supreme Court of India" as const,
  coverage:
    "Supreme Court-only judgment metadata from open mirrors and subject-specific research datasets" as const,
  years: "1950-present where source archives are available" as const,
  fullCourtCoverage: false as const,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function judgmentYear(record: JudgmentRecord) {
  return (record.decisionDate ?? record.judgmentDate ?? "").slice(0, 4);
}

function sourcesFor(records: JudgmentRecord[]): Source[] {
  const sources = new Map<string, Source>();
  for (const record of records) {
    const key = record.sourceUrl ?? record.sourceName;
    sources.set(key, {
      sourceName: record.sourceName,
      sourceUrl: record.sourceUrl,
    });
  }
  return [...sources.values()];
}

function weakestConfidence(records: JudgmentRecord[]): Confidence {
  if (records.some((record) => record.confidence === "experimental")) {
    return "experimental";
  }
  return records[0]?.confidence ?? "experimental";
}

function agesFor(records: JudgmentRecord[]) {
  return records
    .map((record) => approximateCaseAgeYears(record))
    .filter((age): age is number => age !== null);
}

function buildCaseTypes(judgments: JudgmentRecord[]) {
  const groups = Map.groupBy(judgments, (record) => record.caseType);

  return [...groups.entries()]
    .map(([caseType, records]) => {
      const ages = agesFor(records);
      const judgmentsByYear: Record<string, number> = {};
      for (const record of records) {
        const year = judgmentYear(record);
        if (year) {
          increment(judgmentsByYear, year);
        }
      }

      return {
        slug: slugify(caseType),
        caseType,
        sampleSize: records.length,
        medianCaseAgeYears: median(ages),
        p25CaseAgeYears: percentile(ages, 25),
        p75CaseAgeYears: percentile(ages, 75),
        p90CaseAgeYears: percentile(ages, 90),
        oldestCaseAgeYears: ages.length > 0 ? Math.max(...ages) : null,
        judgmentsByYear,
        confidence: weakestConfidence(records),
        caveat: CASE_AGE_CAVEAT,
        sources: sourcesFor(records),
      };
    })
    .sort((a, b) => a.caseType.localeCompare(b.caseType));
}

function buildJudges(judgments: JudgmentRecord[]) {
  const judgeNames = [...new Set(judgments.flatMap((record) => record.judges))];

  return judgeNames
    .map((judgeName) => {
      const benchRecords = judgments.filter((record) =>
        record.judges.includes(judgeName),
      );
      const authoredRecords = judgments.filter(
        (record) => record.authoringJudge === judgeName,
      );
      const ages = agesFor(benchRecords);
      const judgmentsByYear: Record<string, number> = {};
      const caseTypeMix: Record<string, number> = {};
      const subjectMix: Record<string, number> = {};
      const benchSizeProfile: Record<string, number> = {};

      for (const record of benchRecords) {
        const year = judgmentYear(record);
        if (year) {
          increment(judgmentsByYear, year);
        }
        increment(caseTypeMix, record.caseType);
        if (record.benchSize > 0) {
          increment(benchSizeProfile, `${record.benchSize} judge bench`);
        }
        for (const tag of record.subjectTags) {
          increment(subjectMix, tag);
        }
      }

      return {
        slug: slugify(judgeName),
        judgeName,
        authoredJudgments: authoredRecords.length,
        benchAssociatedJudgments: benchRecords.length,
        judgmentsByYear,
        caseTypeMix,
        subjectMix,
        benchSizeProfile,
        medianCaseAgeYears: median(ages),
        casesOlderThan5Years: benchRecords.filter(isOlderThan5Years).length,
        casesOlderThan10Years: benchRecords.filter(isOlderThan10Years).length,
        oldestCaseAgeYears: ages.length > 0 ? Math.max(...ages) : null,
        confidence: weakestConfidence(benchRecords),
        attributionWarning: ATTRIBUTION_WARNING,
        caveat: JUDGE_CAVEAT,
        sources: sourcesFor(benchRecords),
      };
    })
    .sort((a, b) => a.judgeName.localeCompare(b.judgeName));
}

function buildSources(
  courtSnapshot: CourtSnapshot,
  judgments: JudgmentRecord[],
  judgmentSourceKind: "import" | "sample",
) {
  const judgmentSources = sourcesFor(judgments).map((source) => ({
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    proves:
      "Public judgment metadata used to generate case-type and bench-associated metrics.",
    doesNotProve:
      "Official judgment counts, official authorship, final attribution, or legal conclusions.",
    confidence:
      judgmentSourceKind === "sample" ? ("experimental" as Confidence) : ("medium" as Confidence),
    lastUpdated:
      judgmentSourceKind === "sample"
        ? "Generated from local sample seed files."
        : "Generated from data/imports judgment files.",
  }));

  return [
    {
      sourceName: courtSnapshot.sourceName,
      sourceUrl: courtSnapshot.sourceUrl,
      proves:
        "Court snapshot fields for pendency, institution, disposal, old-case disposal, and bench-size distribution.",
      doesNotProve:
        "Individual case timelines, legal outcomes, or responsibility for delay.",
      confidence: courtSnapshot.confidence,
      lastUpdated: courtSnapshot.capturedAt,
    },
    ...judgmentSources,
  ];
}

function buildSiteSummary(
  courtClock: {
    reportingPeriod: string;
    totalPending: number;
    isSampleData: boolean;
  },
  judgments: JudgmentRecord[],
  caseTypeCount: number,
  judgeProfileCount: number,
  sourceCount: number,
) {
  const years = judgments
    .map((record) => Number(judgmentYear(record)))
    .filter((year) => Number.isInteger(year));

  return {
    productName: "Justice Clock India" as const,
    isSampleData: courtClock.isSampleData,
    reportingPeriod: courtClock.reportingPeriod,
    totalPending: courtClock.totalPending,
    totalJudgments: judgments.length,
    caseTypeCount,
    judgeProfileCount,
    sourceCount,
    earliestJudgmentYear: years.length > 0 ? Math.min(...years) : null,
    latestJudgmentYear: years.length > 0 ? Math.max(...years) : null,
    generatedAt: new Date().toISOString(),
  };
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function buildNjdgLatest(courtSnapshot: CourtSnapshot, sourceMode: "import" | "sample") {
  return {
    sourceName: courtSnapshot.sourceName,
    sourceUrl: courtSnapshot.sourceUrl,
    capturedAt: courtSnapshot.capturedAt,
    reportingPeriod: courtSnapshot.reportingPeriod,
    totalPending: courtSnapshot.totalPending,
    civilPending: courtSnapshot.civilPending ?? null,
    criminalPending: courtSnapshot.criminalPending ?? null,
    institutedThisMonth: courtSnapshot.institutedThisMonth ?? null,
    disposedThisMonth: courtSnapshot.disposedThisMonth ?? null,
    oldCasesDisposedThisMonth: courtSnapshot.oldCasesDisposedThisMonth ?? null,
    coramPending: courtSnapshot.coramPending ?? [],
    confidence: courtSnapshot.confidence,
    limitations: courtSnapshot.notes,
    isOfficialApi: false,
    captureMethod: "manual" as const,
    status: sourceMode,
  };
}

function buildJudgmentCorpusSummary(judgments: JudgmentRecord[], sourceMode: "import" | "sample") {
  const years = judgments
    .map((record) => Number(judgmentYear(record)))
    .filter((year) => Number.isInteger(year));
  const sources = sourcesFor(judgments);

  return {
    generatedAt: new Date().toISOString(),
    status: sourceMode,
    court: "Supreme Court of India",
    records: judgments.length,
    earliestYear: years.length > 0 ? Math.min(...years) : null,
    latestYear: years.length > 0 ? Math.max(...years) : null,
    sourceNames: sources.map((source) => source.sourceName),
    sourceNotes: [
      "This is public judgment metadata, not a complete live court service.",
      "Judge pages are public judgment metadata profiles and not a performance rating.",
    ],
  };
}

function buildDelaySummary(judgments: JudgmentRecord[], sourceMode: "import" | "sample") {
  const usable = judgments
    .map((record) => ({ record, age: approximateCaseAgeYears(record) }))
    .filter((item): item is { record: JudgmentRecord; age: number } => item.age !== null);
  const ages = usable.map((item) => item.age);

  return {
    generatedAt: new Date().toISOString(),
    status: sourceMode === "sample" ? "sample" : "generated",
    source: sourceMode === "sample" ? "sample judgments" : "generated from judgment metadata",
    recordsAnalyzed: judgments.length,
    recordsUsable: usable.length,
    recordsExcluded: judgments.length - usable.length,
    confidenceBreakdown: {
      high: 0,
      "medium-high": 0,
      medium: usable.length,
      low: 0,
      experimental: sourceMode === "sample" ? usable.length : 0,
    },
    medianDelayYears: median(ages),
    p75DelayYears: percentile(ages, 75),
    p90DelayYears: percentile(ages, 90),
    longestDelays: usable
      .sort((a, b) => b.age - a.age)
      .slice(0, 20)
      .map(({ record, age }) => ({
        id: record.id,
        caseTitle: record.caseTitle,
        judgmentDate: record.judgmentDate ?? record.decisionDate,
        estimatedDelayYears: age,
      })),
    limitations: [
      "This is historical estimated time-to-judgment, not exact delay of all cases.",
      "Estimates use case year or diary year when exact filing or registration dates are unavailable.",
    ],
  };
}

function buildResearchIndex(root: string) {
  const postsPath = join(root, "data", "research", "posts", "index.json");
  if (!existsSync(postsPath)) {
    return {
      generatedAt: new Date().toISOString(),
      status: "placeholder",
      posts: [],
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    status: "generated",
    posts: JSON.parse(readFileSync(postsPath, "utf8")),
  };
}

function compute() {
  const root = process.cwd();
  const outDir = join(root, "public", "data");
  mkdirSync(outDir, { recursive: true });

  const {
    courtSnapshot,
    courtSnapshotSource,
    judgments,
    judgmentsSource,
  } = loadSourceData(root);
  const sample =
    courtSnapshotSource.mode === "sample" || judgmentsSource.mode === "sample";

  const courtClock = courtClockSchema.parse({
    ...courtSnapshot,
    isSampleData: sample,
    sample,
    clearanceRate: safeClearanceRate(
      courtSnapshot.disposedThisMonth,
      courtSnapshot.institutedThisMonth,
    ),
  });
  const caseTypes = caseTypeMetricsSchema.parse(buildCaseTypes(judgments));
  const judges = judgeProfilesSchema.parse(buildJudges(judgments));
  const sources = sourceCardsSchema.parse(
    buildSources(courtSnapshot, judgments, judgmentsSource.mode),
  );
  const generatedAt = new Date().toISOString();
  const publicLaunchReady =
    courtSnapshotSource.mode === "import" &&
    judgmentsSource.mode === "import" &&
    !sample &&
    judgments.length > 0;
  const hasImljd = judgments.some((record) => record.sourceName === IMLJD_SOURCE_NAME);
  const hasHfSupremeCourtMirror = judgments.some(
    (record) => record.sourceName === HF_SC_SOURCE_NAME,
  );
  const datasetScope = hasHfSupremeCourtMirror
    ? MIXED_SC_DATASET_SCOPE
    : hasImljd
      ? IMLJD_DATASET_SCOPE
      : undefined;
  const metadata = {
    generatedAt,
    files: {
      bundledDataset: "/data/justice-clock-data.json",
      courtClock: "/data/court-clock.json",
      caseTypes: "/data/case-types.json",
      judges: "/data/judges.json",
      judgments: "/data/judgments.json",
      njdgLatest: "/data/njdg-latest.json",
      judgmentCorpusSummary: "/data/judgment-corpus-summary.json",
      delaySummary: "/data/delay-summary.json",
      researchIndex: "/data/research-index.json",
    },
    sources: {
      courtSnapshot: courtSnapshotSource,
      judgments: judgmentsSource,
    },
    counts: {
      judgmentRecords: judgments.length,
      caseTypes: caseTypes.length,
      judgeProfiles: judges.length,
    },
    ...(datasetScope ? { datasetScope } : {}),
    sample,
    publicLaunchReady,
  };
  const bundledDataset = justiceClockDatasetSchema.parse({
    metadata,
    courtClock,
    caseTypes,
    judges,
    judgments,
  });
  const siteSummary = siteSummarySchema.parse(
    buildSiteSummary(
      courtClock,
      judgments,
      caseTypes.length,
      judges.length,
      sources.length,
    ),
  );

  writeJson(join(outDir, "court-clock.json"), courtClock);
  writeJson(join(outDir, "case-types.json"), caseTypes);
  writeJson(join(outDir, "judges.json"), judges);
  writeJson(join(outDir, "judgments.json"), judgments);
  writeJson(join(outDir, "justice-clock-data.json"), bundledDataset);
  writeJson(join(outDir, "sources.json"), sources);
  writeJson(join(outDir, "site-summary.json"), siteSummary);
  writeJson(join(outDir, "njdg-latest.json"), buildNjdgLatest(courtSnapshot, courtSnapshotSource.mode));
  writeJson(
    join(outDir, "judgment-corpus-summary.json"),
    buildJudgmentCorpusSummary(judgments, judgmentsSource.mode),
  );
  writeJson(join(outDir, "delay-summary.json"), buildDelaySummary(judgments, judgmentsSource.mode));
  writeJson(join(outDir, "research-index.json"), buildResearchIndex(root));

  console.log("OK: generated public/data/court-clock.json");
  console.log("OK: generated public/data/case-types.json");
  console.log("OK: generated public/data/judges.json");
  console.log("OK: generated public/data/judgments.json");
  console.log("OK: generated public/data/justice-clock-data.json");
  console.log("OK: generated public/data/sources.json");
  console.log("OK: generated public/data/site-summary.json");
  console.log("OK: generated public/data/njdg-latest.json");
  console.log("OK: generated public/data/judgment-corpus-summary.json");
  console.log("OK: generated public/data/delay-summary.json");
  console.log("OK: generated public/data/research-index.json");
  console.log(
    `OK: court snapshot source=${courtSnapshotSource.mode} (${courtSnapshotSource.path})`,
  );
  console.log(
    `OK: judgment source=${judgmentsSource.mode} (${judgmentsSource.path})`,
  );
}

try {
  compute();
} catch (error) {
  console.error("Metric computation failed.");
  console.error(error);
  process.exit(1);
}

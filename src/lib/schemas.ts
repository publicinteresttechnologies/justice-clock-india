import { z } from "zod";

const currentYear = new Date().getUTCFullYear();
const plausibleCaseYearSchema = z
  .number()
  .int()
  .min(1950)
  .max(currentYear + 1);

export const confidenceSchema = z.enum([
  "high",
  "medium-high",
  "medium",
  "low",
  "experimental",
]);

export const sourceSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
});

export const nullableNonnegativeIntegerSchema = z
  .number()
  .int()
  .nonnegative()
  .nullable();

export const coramPendingItemSchema = z.object({
  benchSize: z.string().min(1),
  pending: z.number().int().nonnegative(),
});

export const courtSnapshotSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  capturedAt: z.string().datetime(),
  reportingPeriod: z.string().min(1),
  totalPending: z.number().int().nonnegative(),
  civilPending: nullableNonnegativeIntegerSchema.optional().default(null),
  criminalPending: nullableNonnegativeIntegerSchema.optional().default(null),
  institutedThisMonth: nullableNonnegativeIntegerSchema.optional().default(null),
  disposedThisMonth: nullableNonnegativeIntegerSchema.optional().default(null),
  oldCasesDisposedThisMonth: nullableNonnegativeIntegerSchema.optional().default(null),
  coramPending: z.array(coramPendingItemSchema).optional().default([]),
  confidence: confidenceSchema,
  notes: z.array(z.string()),
});

export const judgmentRecordSchema = z.object({
  id: z.string().min(1),
  caseTitle: z.string().min(1),
  caseNumber: z.string().nullable(),
  diaryNumber: z.string().nullable(),
  diaryYear: plausibleCaseYearSchema.nullable(),
  caseType: z.string().min(1),
  caseYear: plausibleCaseYearSchema.nullable(),
  decisionDate: z.string().date().nullable(),
  judgmentDate: z.string().date().nullable(),
  uploadDate: z.string().date().nullable(),
  disposalNature: z.string().nullable(),
  judges: z.array(z.string().min(1)),
  authoringJudge: z.string().nullable(),
  benchSize: z.number().int().min(0).max(17),
  subjectTags: z.array(z.string()),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  confidence: confidenceSchema,
  sample: z.boolean(),
}).refine((record) => record.decisionDate !== null || record.judgmentDate !== null, {
  message: "Judgment must include judgmentDate or decisionDate.",
  path: ["judgmentDate"],
});

export const supremeCourtJudgmentMetadataSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().optional(),
  cnr: z.string().optional(),
  title: z.string().min(1),
  petitioner: z.string().optional(),
  respondent: z.string().optional(),
  description: z.string().optional(),
  judge: z.string().optional(),
  judges: z.array(z.string().min(1)),
  authorJudge: z.string().optional(),
  citation: z.string().optional(),
  neutralCitation: z.string().optional(),
  decisionDate: z.string().date().optional(),
  decisionYear: plausibleCaseYearSchema.optional(),
  disposalNature: z.string().optional(),
  court: z.string().optional(),
  availableLanguages: z.array(z.string()).optional(),
  sourcePath: z.string().optional(),
  metadataUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  scrapedAt: z.string().datetime().optional(),
  confidence: confidenceSchema,
});

export const caseTypeMetricSchema = z.object({
  slug: z.string().min(1),
  caseType: z.string().min(1),
  sampleSize: z.number().int().nonnegative(),
  medianCaseAgeYears: z.number().nullable(),
  p25CaseAgeYears: z.number().nullable(),
  p75CaseAgeYears: z.number().nullable(),
  p90CaseAgeYears: z.number().nullable(),
  oldestCaseAgeYears: z.number().nullable(),
  judgmentsByYear: z.record(z.string(), z.number().int().nonnegative()),
  confidence: confidenceSchema,
  caveat: z.string().min(1),
  sources: z.array(sourceSchema),
});

export const judgeProfileSchema = z.object({
  slug: z.string().min(1),
  judgeName: z.string().min(1),
  authoredJudgments: z.number().int().nonnegative(),
  benchAssociatedJudgments: z.number().int().nonnegative(),
  judgmentsByYear: z.record(z.string(), z.number().int().nonnegative()),
  caseTypeMix: z.record(z.string(), z.number().int().nonnegative()),
  subjectMix: z.record(z.string(), z.number().int().nonnegative()),
  benchSizeProfile: z.record(z.string(), z.number().int().nonnegative()),
  medianCaseAgeYears: z.number().nullable(),
  casesOlderThan5Years: z.number().int().nonnegative(),
  casesOlderThan10Years: z.number().int().nonnegative(),
  oldestCaseAgeYears: z.number().nullable(),
  confidence: confidenceSchema,
  attributionWarning: z.string().min(1),
  caveat: z.string().min(1),
  sources: z.array(sourceSchema),
});

export const courtClockSchema = courtSnapshotSchema.extend({
  isSampleData: z.boolean(),
  sample: z.boolean(),
  clearanceRate: z.number().nullable(),
});

export const sourceKindSchema = z.enum(["import", "sample"]);
export const dataStatusSchema = z.enum([
  "sample",
  "import",
  "placeholder",
  "generated",
]);

export const datasetScopeSchema = z.object({
  name: z.string().min(1),
  court: z.literal("Supreme Court of India"),
  coverage: z.string().min(1),
  years: z.string().min(1),
  fullCourtCoverage: z.boolean(),
});

export const bundledDatasetMetadataSchema = z.object({
  generatedAt: z.string().datetime(),
  files: z.object({
    bundledDataset: z.literal("/data/justice-clock-data.json"),
    courtClock: z.literal("/data/court-clock.json"),
    caseTypes: z.literal("/data/case-types.json"),
    judges: z.literal("/data/judges.json"),
    judgments: z.literal("/data/judgments.json"),
    njdgLatest: z.literal("/data/njdg-latest.json").optional(),
    judgmentCorpusSummary: z
      .literal("/data/judgment-corpus-summary.json")
      .optional(),
    delaySummary: z.literal("/data/delay-summary.json").optional(),
    researchIndex: z.literal("/data/research-index.json").optional(),
  }),
  sources: z.object({
    courtSnapshot: z.object({
      mode: sourceKindSchema,
      path: z.string().min(1),
    }),
    judgments: z.object({
      mode: sourceKindSchema,
      path: z.string().min(1),
    }),
  }),
  counts: z.object({
    judgmentRecords: z.number().int().nonnegative(),
    caseTypes: z.number().int().nonnegative(),
    judgeProfiles: z.number().int().nonnegative(),
  }),
  datasetScope: datasetScopeSchema.optional(),
  sample: z.boolean(),
  publicLaunchReady: z.boolean(),
});

export const justiceClockDatasetSchema = z.object({
  metadata: bundledDatasetMetadataSchema,
  courtClock: courtClockSchema,
  caseTypes: z.array(caseTypeMetricSchema),
  judges: z.array(judgeProfileSchema),
  judgments: z.array(judgmentRecordSchema),
});

export const sourceCardSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  proves: z.string().min(1),
  doesNotProve: z.string().min(1),
  confidence: confidenceSchema,
  lastUpdated: z.string().min(1),
});

export const siteSummarySchema = z.object({
  productName: z.literal("Justice Clock India"),
  isSampleData: z.boolean(),
  reportingPeriod: z.string().min(1),
  totalPending: z.number().int().nonnegative(),
  totalJudgments: z.number().int().nonnegative(),
  caseTypeCount: z.number().int().nonnegative(),
  judgeProfileCount: z.number().int().nonnegative(),
  sourceCount: z.number().int().nonnegative(),
  earliestJudgmentYear: z.number().int().nullable(),
  latestJudgmentYear: z.number().int().nullable(),
  generatedAt: z.string().datetime(),
});

export const judgmentsSchema = z.array(judgmentRecordSchema).min(1);
export const caseTypeMetricsSchema = z.array(caseTypeMetricSchema);
export const judgeProfilesSchema = z.array(judgeProfileSchema);
export const sourceCardsSchema = z.array(sourceCardSchema);
export const justiceClockDatasetMetadataSchema = bundledDatasetMetadataSchema;

export type Confidence = z.infer<typeof confidenceSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type SourceKind = z.infer<typeof sourceKindSchema>;
export type DatasetScope = z.infer<typeof datasetScopeSchema>;
export type CourtSnapshot = z.infer<typeof courtSnapshotSchema>;
export type JudgmentRecord = z.infer<typeof judgmentRecordSchema>;
export type SupremeCourtJudgmentMetadata = z.infer<
  typeof supremeCourtJudgmentMetadataSchema
>;
export type CaseTypeMetric = z.infer<typeof caseTypeMetricSchema>;
export type JudgeProfile = z.infer<typeof judgeProfileSchema>;
export type CourtClock = z.infer<typeof courtClockSchema>;
export type SourceCard = z.infer<typeof sourceCardSchema>;
export type SiteSummary = z.infer<typeof siteSummarySchema>;
export type JusticeClockDatasetMetadata = z.infer<
  typeof justiceClockDatasetMetadataSchema
>;
export type JusticeClockDataset = z.infer<typeof justiceClockDatasetSchema>;

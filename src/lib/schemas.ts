import { z } from "zod";

export const confidenceSchema = z.enum([
  "high",
  "medium-high",
  "medium",
  "low",
  "experimental",
]);

export const courtSnapshotSchema = z.object({
  sourceName: z.string(),
  sourceUrl: z.string().url().optional(),
  capturedAt: z.string(),
  reportingPeriod: z.string(),
  totalPending: z.number().nonnegative(),
  civilPending: z.number().nonnegative().optional(),
  criminalPending: z.number().nonnegative().optional(),
  institutedThisMonth: z.number().nonnegative().optional(),
  disposedThisMonth: z.number().nonnegative().optional(),
  oldCasesDisposedThisMonth: z.number().nonnegative().optional(),
  coramPending: z
    .array(
      z.object({
        benchSize: z.string(),
        pending: z.number().nonnegative(),
      }),
    )
    .optional(),
  confidence: confidenceSchema,
  notes: z.array(z.string()).optional(),
  sample: z.boolean().optional(),
});

export const judgmentRecordSchema = z.object({
  id: z.string(),
  caseTitle: z.string(),
  caseNumber: z.string().optional(),
  diaryNumber: z.string().optional(),
  diaryYear: z.number().int().optional(),
  caseType: z.string().optional(),
  caseYear: z.number().int().optional(),
  decisionDate: z.string().optional(),
  judgmentDate: z.string().optional(),
  uploadDate: z.string().optional(),
  disposalNature: z.string().optional(),
  judges: z.array(z.string()),
  authoringJudge: z.string().optional(),
  benchSize: z.number().int().positive().optional(),
  subjectTags: z.array(z.string()).optional(),
  sourceName: z.string(),
  sourceUrl: z.string().url().optional(),
  confidence: confidenceSchema,
  sample: z.boolean().optional(),
});

export const caseTypeMetricSchema = z.object({
  slug: z.string(),
  caseType: z.string(),
  sampleSize: z.number().int().nonnegative(),
  medianCaseAgeYears: z.number().nullable(),
  p25CaseAgeYears: z.number().nullable(),
  p75CaseAgeYears: z.number().nullable(),
  p90CaseAgeYears: z.number().nullable(),
  oldestCaseAgeYears: z.number().nullable(),
  judgmentsByYear: z.array(z.object({ year: z.number().int(), count: z.number().int().nonnegative() })),
  confidence: confidenceSchema,
  caveat: z.string(),
  sources: z.array(z.object({ name: z.string(), url: z.string().url().optional() })),
  sample: z.boolean().optional(),
});

export const judgeProfileSchema = z.object({
  slug: z.string(),
  judgeName: z.string(),
  activeYears: z.string().optional(),
  authoredJudgments: z.number().int().nonnegative(),
  benchAssociatedJudgments: z.number().int().nonnegative(),
  judgmentsByYear: z.array(z.object({ year: z.number().int(), count: z.number().int().nonnegative() })),
  caseTypeMix: z.array(z.object({ caseType: z.string(), count: z.number().int().nonnegative(), percentage: z.number().nonnegative() })),
  subjectMix: z.array(z.object({ subject: z.string(), count: z.number().int().nonnegative(), percentage: z.number().nonnegative() })),
  benchSizeProfile: z.array(z.object({ benchSize: z.string(), count: z.number().int().nonnegative() })),
  medianCaseAgeYears: z.number().nullable(),
  casesOlderThan5Years: z.number().int().nonnegative(),
  casesOlderThan10Years: z.number().int().nonnegative(),
  oldestCaseAgeYears: z.number().nullable(),
  confidence: confidenceSchema,
  attributionWarning: z.string(),
  caveat: z.string(),
  sources: z.array(z.object({ name: z.string(), url: z.string().url().optional() })),
  sample: z.boolean().optional(),
});

export type ConfidenceLevel = z.infer<typeof confidenceSchema>;
export type CourtSnapshot = z.infer<typeof courtSnapshotSchema>;
export type JudgmentRecord = z.infer<typeof judgmentRecordSchema>;
export type CaseTypeMetric = z.infer<typeof caseTypeMetricSchema>;
export type JudgeProfile = z.infer<typeof judgeProfileSchema>;

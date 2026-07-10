import { describe, expect, it } from "vitest";
import {
  approximateCaseAgeYears,
  getJudgmentYear,
  getYear,
  isOlderThan10Years,
  isOlderThan5Years,
  median,
  percentile,
  safeClearanceRate,
  weakestConfidence,
} from "./metrics";
import type { JudgmentRecord } from "./schemas";

const baseRecord: JudgmentRecord = {
  id: "sample",
  caseTitle: "Sample",
  caseNumber: null,
  diaryNumber: null,
  diaryYear: 2015,
  caseType: "SLP Civil",
  caseYear: 2016,
  decisionDate: "2026-01-01",
  judgmentDate: null,
  uploadDate: null,
  disposalNature: null,
  judges: ["Sample Judge A"],
  authoringJudge: null,
  benchSize: 1,
  subjectTags: [],
  sourceName: "Sample Source",
  sourceUrl: "https://example.test/source",
  confidence: "experimental",
  sample: true,
};

describe("metric utilities", () => {
  it("calculates safe clearance rates", () => {
    expect(safeClearanceRate(75, 100)).toBe(75);
    expect(safeClearanceRate(1, 0)).toBeNull();
  });

  it("calculates median values", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("calculates interpolated percentiles", () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentile([1, 2, 3, 4], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4], 100)).toBe(4);
  });

  it("extracts years from date strings", () => {
    expect(getYear("2026-06-17")).toBe(2026);
    expect(getYear(null)).toBeNull();
    expect(getYear("not-a-date")).toBeNull();
  });

  it("returns null when a judgment has no usable date", () => {
    expect(
      getJudgmentYear({
        decisionDate: null,
        judgmentDate: null,
      }),
    ).toBeNull();
  });

  it("returns the weakest confidence in a mixed record group", () => {
    expect(
      weakestConfidence([
        { confidence: "high" },
        { confidence: "low" },
        { confidence: "medium" },
      ]),
    ).toBe("low");
  });

  it("calculates approximate case-age-to-judgment gap", () => {
    expect(approximateCaseAgeYears(baseRecord)).toBe(11);
    expect(
      approximateCaseAgeYears({
        ...baseRecord,
        diaryYear: null,
        caseYear: 2020,
        decisionDate: null,
        judgmentDate: "2024-01-01",
      }),
    ).toBe(4);
  });

  it("flags records older than five and ten years", () => {
    expect(isOlderThan5Years(baseRecord)).toBe(true);
    expect(isOlderThan10Years(baseRecord)).toBe(true);
    expect(isOlderThan10Years({ ...baseRecord, diaryYear: 2020 })).toBe(false);
  });
});

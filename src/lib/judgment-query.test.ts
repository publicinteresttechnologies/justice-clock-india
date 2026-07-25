import { describe, expect, it } from "vitest";
import { queryJudgmentRecords } from "./judgment-query";
import type { JudgmentRecord } from "./schemas";

function record(
  id: string,
  overrides: Partial<JudgmentRecord> = {},
): JudgmentRecord {
  return {
    id,
    caseTitle: `Case ${id}`,
    caseNumber: `C.A. ${id}`,
    diaryNumber: null,
    diaryYear: 2015,
    caseType: "Civil Appeal",
    caseYear: 2015,
    decisionDate: `202${id}-01-01`,
    judgmentDate: null,
    uploadDate: null,
    disposalNature: null,
    judges: ["Justice Example"],
    authoringJudge: null,
    benchSize: 2,
    subjectTags: [],
    sourceName: "Test source",
    sourceUrl: "https://example.test/source",
    confidence: "medium",
    sample: false,
    ...overrides,
  };
}

const records = [
  record("1", { decisionDate: "2021-01-01" }),
  record("2", {
    caseTitle: "Liberty matter",
    caseType: "Criminal Appeal",
    decisionDate: "2022-01-01",
    judges: ["Justice Other"],
    benchSize: 3,
  }),
  record("3", { decisionDate: "2023-01-01" }),
];

describe("judgment query engine", () => {
  it("returns only the requested page", () => {
    const result = queryJudgmentRecords(records, {
      page: 2,
      pageSize: 2,
    });

    expect(result.total).toBe(3);
    expect(result.pageCount).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("1");
  });

  it("preserves search and filter behaviour", () => {
    const result = queryJudgmentRecords(records, {
      query: "liberty",
      caseType: "Criminal Appeal",
      judge: "Justice Other",
      benchSize: 3,
      year: 2022,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.caseTitle).toBe("Liberty matter");
  });

  it("returns global filter options with a small page", () => {
    const result = queryJudgmentRecords(records, { pageSize: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.filters.caseTypes).toEqual([
      "Civil Appeal",
      "Criminal Appeal",
    ]);
    expect(result.filters.judges).toContain("Justice Other");
    expect(result.filters.years).toEqual([2023, 2022, 2021]);
  });
});

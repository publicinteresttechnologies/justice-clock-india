import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSourceData } from "./source-data";

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), "jci-source-data-"));
  mkdirSync(join(root, "data", "imports"), { recursive: true });
  mkdirSync(join(root, "data", "seed"), { recursive: true });
  writeFileSync(
    join(root, "data", "seed", "court-snapshot.sample.json"),
    JSON.stringify({
      sourceName: "Sample Source",
      sourceUrl: "https://example.test/court",
      capturedAt: "2026-06-18T00:00:00.000Z",
      reportingPeriod: "Sample period",
      totalPending: 1,
      civilPending: 1,
      criminalPending: 0,
      institutedThisMonth: 1,
      disposedThisMonth: 1,
      oldCasesDisposedThisMonth: 0,
      coramPending: [{ benchSize: "Two judges", pending: 1 }],
      confidence: "experimental",
      notes: ["sample"],
    }),
  );
  writeFileSync(
    join(root, "data", "seed", "judgments.sample.json"),
    JSON.stringify([
      {
        caseTitle: "Sample Case",
        caseNumber: "Sample No. 1",
        diaryNumber: null,
        diaryYear: 2020,
        caseType: "Civil Appeal",
        caseYear: 2020,
        decisionDate: "2026-01-01",
        judgmentDate: "2026-01-01",
        uploadDate: null,
        disposalNature: null,
        judges: ["Sample Judge A"],
        authoringJudge: null,
        benchSize: 1,
        subjectTags: [],
        sourceName: "Sample Judgment Source",
        sourceUrl: "https://example.test/judgments",
        confidence: "experimental",
        sample: true,
      },
    ]),
  );
  return root;
}

describe("source data importer", () => {
  it("loads CSV imports with deterministic ids, defaults, and semicolon lists", () => {
    const root = createRoot();
    writeFileSync(
      join(root, "data", "imports", "judgments.csv"),
      [
        "id,caseTitle,caseNumber,diaryNumber,diaryYear,caseType,caseYear,decisionDate,judgmentDate,uploadDate,disposalNature,judges,authoringJudge,benchSize,subjectTags,sourceName,sourceUrl,confidence,sample",
        ',Imported Case,Civil Appeal No. 1/2026,,2020,Civil Appeal,2021,2026-01-02,2026-01-03,,Disposed,"Justice A; Justice B",Justice A,,civil; property,Import Source,https://example.test/import,,',
      ].join("\n"),
    );

    const data = loadSourceData(root);
    expect(data.judgmentsSource.mode).toBe("import");
    expect(data.judgments).toHaveLength(1);
    expect(data.judgments[0].id).toMatch(/^judgment-/);
    expect(data.judgments[0].confidence).toBe("medium");
    expect(data.judgments[0].sample).toBe(false);
    expect(data.judgments[0].judges).toEqual(["Justice A", "Justice B"]);
    expect(data.judgments[0].subjectTags).toEqual(["civil", "property"]);
    expect(data.judgments[0].benchSize).toBe(2);
  });

  it("fails when an import exists but is malformed", () => {
    const root = createRoot();
    writeFileSync(
      join(root, "data", "imports", "judgments.json"),
      JSON.stringify([
        {
          caseTitle: "",
          judges: [],
          judgmentDate: null,
          decisionDate: null,
          sourceUrl: "not-a-url",
          confidence: "certain",
          benchSize: 18,
          diaryYear: 1949,
          caseYear: 1949,
        },
      ]),
    );

    expect(() => loadSourceData(root)).toThrow();
  });
});

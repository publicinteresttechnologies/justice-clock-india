import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { justiceClockDatasetSchema, judgmentsSchema } from "../src/lib/schemas";

const outputFiles = [
  "court-clock.json",
  "case-types.json",
  "judges.json",
  "judgments.json",
  "justice-clock-data.json",
];

describe("generated public data", () => {
  it("contains all expected JSON outputs and bundled metadata", () => {
    const root = process.cwd();
    for (const file of outputFiles) {
      expect(existsSync(join(root, "public", "data", file))).toBe(true);
    }

    const judgments = judgmentsSchema.parse(
      JSON.parse(
        readFileSync(join(root, "public", "data", "judgments.json"), "utf8"),
      ),
    );
    const dataset = justiceClockDatasetSchema.parse(
      JSON.parse(
        readFileSync(
          join(root, "public", "data", "justice-clock-data.json"),
          "utf8",
        ),
      ),
    );

    expect(judgments.length).toBeGreaterThan(0);
    expect(dataset.metadata.files.judgments).toBe("/data/judgments.json");
    expect(dataset.metadata.counts.judgmentRecords).toBe(
      judgments.length,
    );
    expect(dataset.metadata.sources.courtSnapshot.mode).toMatch(
      /^(import|sample)$/,
    );
    expect(dataset.metadata.sources.judgments.mode).toMatch(/^(import|sample)$/);
    expect(typeof dataset.metadata.publicLaunchReady).toBe("boolean");
  });
});

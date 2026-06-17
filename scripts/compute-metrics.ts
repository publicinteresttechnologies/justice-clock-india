import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  courtSnapshotSchema,
  judgmentRecordSchema,
  type JudgmentRecord,
} from "../src/lib/schemas";
import {
  buildCaseTypeMetrics,
  buildCourtClock,
  buildJudgeProfiles,
} from "../src/lib/metrics";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const root = process.cwd();
  const courtPath = path.join(root, "data/seed/court-snapshot.sample.json");
  const judgmentsPath = path.join(root, "data/seed/judgments.sample.json");
  const outputDir = path.join(root, "public/data");

  const courtSnapshot = courtSnapshotSchema.parse(await readJson<unknown>(courtPath));
  const judgmentInput = await readJson<unknown>(judgmentsPath);

  if (!Array.isArray(judgmentInput)) {
    throw new Error("Judgments seed file must be an array.");
  }

  const judgments: JudgmentRecord[] = judgmentInput.map((record) =>
    judgmentRecordSchema.parse(record),
  );

  await mkdir(outputDir, { recursive: true });

  await writeJson(path.join(outputDir, "court-clock.json"), buildCourtClock(courtSnapshot));
  await writeJson(path.join(outputDir, "case-types.json"), buildCaseTypeMetrics(judgments));
  await writeJson(path.join(outputDir, "judges.json"), buildJudgeProfiles(judgments));

  console.log("Generated public/data/court-clock.json");
  console.log("Generated public/data/case-types.json");
  console.log("Generated public/data/judges.json");
}

main().catch((error) => {
  console.error("Metric computation failed.");
  console.error(error);
  process.exit(1);
});

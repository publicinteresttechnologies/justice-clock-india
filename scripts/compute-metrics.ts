import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCaseTypeMetrics,
  buildCourtClock,
  buildJudgeProfiles,
} from "../src/lib/metrics";
import { loadCourtSnapshot, loadJudgments } from "./lib/source-data";

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const root = process.cwd();
  const outputDir = path.join(root, "public/data");

  const courtSource = await loadCourtSnapshot(root);
  const judgmentSource = await loadJudgments(root);

  const courtSnapshot = courtSource.data;
  const judgments = judgmentSource.data;

  const courtClock = buildCourtClock(courtSnapshot);
  const caseTypes = buildCaseTypeMetrics(judgments);
  const judges = buildJudgeProfiles(judgments);
  const sample = courtSource.sourceType === "sample" || judgmentSource.sourceType === "sample" || courtSnapshot.sample || judgments.some((judgment) => judgment.sample);

  const bundledDataset = {
    metadata: {
      project: "Justice Clock India",
      title: "Supreme Court Time to Justice Tracker",
      generatedAt: new Date().toISOString(),
      sample,
      status: sample ? "sample-data" : "generated-data",
      warning: sample
        ? "This bundled dataset contains sample records and must not be presented as official court data."
        : "Generated from configured source files.",
      inputs: {
        courtSnapshot: courtSource.sourcePath.replace(`${root}/`, ""),
        judgments: judgmentSource.sourcePath.replace(`${root}/`, ""),
      },
      files: {
        courtClock: "/data/court-clock.json",
        caseTypes: "/data/case-types.json",
        judges: "/data/judges.json",
        bundledDataset: "/data/justice-clock-data.json",
      },
    },
    courtClock,
    caseTypes,
    judges,
    judgments,
  };

  await mkdir(outputDir, { recursive: true });

  await writeJson(path.join(outputDir, "court-clock.json"), courtClock);
  await writeJson(path.join(outputDir, "case-types.json"), caseTypes);
  await writeJson(path.join(outputDir, "judges.json"), judges);
  await writeJson(path.join(outputDir, "justice-clock-data.json"), bundledDataset);

  console.log(`Loaded court snapshot from ${courtSource.sourcePath.replace(`${root}/`, "")}`);
  console.log(`Loaded judgments from ${judgmentSource.sourcePath.replace(`${root}/`, "")}`);
  console.log("Generated public/data/court-clock.json");
  console.log("Generated public/data/case-types.json");
  console.log("Generated public/data/judges.json");
  console.log("Generated public/data/justice-clock-data.json");
}

main().catch((error) => {
  console.error("Metric computation failed.");
  console.error(error);
  process.exit(1);
});

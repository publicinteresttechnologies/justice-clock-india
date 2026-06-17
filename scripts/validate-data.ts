import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  courtSnapshotSchema,
  judgmentRecordSchema,
} from "../src/lib/schemas";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const root = process.cwd();
  const courtPath = path.join(root, "data/seed/court-snapshot.sample.json");
  const judgmentsPath = path.join(root, "data/seed/judgments.sample.json");

  const courtSnapshot = await readJson<unknown>(courtPath);
  const judgments = await readJson<unknown>(judgmentsPath);

  courtSnapshotSchema.parse(courtSnapshot);

  if (!Array.isArray(judgments)) {
    throw new Error("Judgments seed file must be an array.");
  }

  for (const judgment of judgments) {
    judgmentRecordSchema.parse(judgment);
  }

  console.log("Data validation passed.");
}

main().catch((error) => {
  console.error("Data validation failed.");
  console.error(error);
  process.exit(1);
});

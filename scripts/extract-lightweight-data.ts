import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { justiceClockDatasetMetadataSchema } from "../src/lib/schemas";

const root = process.cwd();
const bundledPath = join(root, "public", "data", "justice-clock-data.json");
const outputPath = join(root, "public", "data", "data-metadata.json");

const bundled = JSON.parse(readFileSync(bundledPath, "utf8")) as {
  metadata?: unknown;
};
const metadata = justiceClockDatasetMetadataSchema.parse(bundled.metadata);

writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`);
console.log("OK: generated public/data/data-metadata.json");

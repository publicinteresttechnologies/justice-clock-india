import { loadSourceData } from "./lib/source-data";

function validate() {
  console.log("Validating Justice Clock India source data...");
  const data = loadSourceData(process.cwd());

  console.log(
    `OK: court snapshot ${data.courtSnapshotSource.mode} is valid (${data.courtSnapshotSource.path}).`,
  );

  console.log(
    `OK: ${data.judgments.length} judgment records from ${data.judgmentsSource.mode} are valid (${data.judgmentsSource.path}).`,
  );

  if (data.judgments.length === 0) {
    throw new Error("Judgment source is empty.");
  }
}

try {
  validate();
} catch (error) {
  console.error("Data validation failed.");
  console.error(error);
  process.exit(1);
}

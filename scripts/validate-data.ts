import { loadCourtSnapshot, loadJudgments } from "./lib/source-data";

async function main() {
  const root = process.cwd();
  const courtSource = await loadCourtSnapshot(root);
  const judgmentSource = await loadJudgments(root);

  console.log(`Court snapshot validated from ${courtSource.sourcePath.replace(`${root}/`, "")}`);
  console.log(`Judgment records validated from ${judgmentSource.sourcePath.replace(`${root}/`, "")}`);
  console.log(`Validated ${judgmentSource.data.length} judgment record${judgmentSource.data.length === 1 ? "" : "s"}.`);
  console.log("Data validation passed.");
}

main().catch((error) => {
  console.error("Data validation failed.");
  console.error(error);
  process.exit(1);
});

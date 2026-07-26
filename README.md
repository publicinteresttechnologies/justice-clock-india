# Justice Clock India

Justice Clock India is a mobile-first public data website for tracking Supreme Court pendency, case-type delay, and public judgment metadata profiles from repeatable public data.

The app keeps a conservative public-interest tone. Judge pages are public judgment metadata profiles, not performance ratings. Case-age metrics are described as approximate case-age-to-judgment gaps unless exact dates are available.

## Setup

```bash
npm install
npm run data:build
npm run dev
```

The project also works with pnpm, but CI and public setup instructions use npm scripts.

## Add Real Judgments CSV

Create `data/imports/judgments.csv`. You can start from:

```text
data/imports/judgments.template.csv
```

Supported columns:

```text
id,caseTitle,caseNumber,diaryNumber,diaryYear,caseType,caseYear,decisionDate,judgmentDate,uploadDate,disposalNature,judges,authoringJudge,benchSize,subjectTags,sourceName,sourceUrl,confidence,sample
```

CSV conventions:

- `judges` is semicolon separated, for example `Justice A; Justice B`.
- `subjectTags` is semicolon separated, for example `civil; property`.
- Optional empty fields are normalized to blank/null values.
- If `id` is missing, it is generated deterministically from case title, judgment or decision date, and case number when possible.
- `confidence` defaults to `medium` for imports unless specified.
- `sample` defaults to `false` for imports.

You may also provide `data/imports/judgments.json` as an array of judgment records with the same field names.

## Optional Supreme Court Sources Import

The optional source importer reads Supreme Court of India public judgment metadata from the configured Hugging Face mirror and merges new records into `data/imports/judgments.csv`. It is a manual/offline ingestion step and is not called from Next.js pages.

Run a narrow year range first:

```bash
npm run import:supreme-court-sources -- --from-year=2024 --to-year=2024
npm run data:build
```

The shorter alias is equivalent:

```bash
npm run import:sources -- --from-year=2024 --to-year=2024
```

The importer stores raw source archives under `data/raw/hf-supreme-court-judgments/`, normalizes Supreme Court metadata, deduplicates against committed imports, and writes the merged CSV to `data/imports/judgments.csv`.

## IMLJD Supreme Court Seed Dataset

IMLJD is the Indian Matrimonial Litigation Judgment Dataset, an open research dataset for matrimonial and criminal-family litigation analysis. Its public materials describe 3,613 Indian court judgments in total, including a Supreme Court of India subset of 1,474 cases covering 2000-2024.

Justice Clock India uses IMLJD as a subject-specific enrichment source. It is not full Supreme Court coverage, and generated metrics from IMLJD must be read as subject-specific public judgment metadata rather than whole-court metrics.

Run the importer directly:

```bash
npm run import:imljd
npm run data:build
npm run build
```

The importer attempts to load IMLJD from Hugging Face or GitHub, saves the raw source under `data/raw/imljd/`, filters to Supreme Court of India records, excludes Karnataka High Court records, and writes normalized records to `data/imports/judgments.csv`. The scheduled refresh workflow backs up the full corpus first, refreshes IMLJD from its independent upstream source, and merges only refreshed IMLJD rows back into the full corpus.

If remote download is unavailable, place a local fallback at either:

```text
data/imports/imljd.json
data/imports/imljd.csv
data/imports/imljd/sc_enriched.csv
```

## Supreme Court NJDG Snapshot

`data/imports/court-snapshot.json` stores the latest timestamped Supreme Court of India NJDG snapshot. The snapshot includes:

- total, civil, and criminal pendency
- cases instituted and disposed in the last month
- cases over ten years old disposed in the last month
- coram-wise totals for 3, 5, 7, 9, 11, and more-than-11-judge matters

Normalize the committed snapshot:

```bash
npm run import:njdg
```

Fetch and validate a fresh snapshot from the official public NJDG Supreme Court At a Glance page:

```bash
npm run import:njdg -- --fetch-live
```

The live importer verifies that civil plus criminal pendency equals total pendency, requires the monthly movement and coram tables, writes `public/data/njdg-latest.json`, and stores a dated snapshot under `data/research/njdg-snapshots/`. It parses public HTML; it does not claim access to an official API. If the scheduled live capture fails, the workflow retains and republishes the last committed snapshot rather than fabricating values.

## Supreme Court Corpus Import

The long-form Supreme Court metadata importer is manual/workflow-only. It must not run inside the Vercel build.

```bash
npm run import:sc-metadata
```

The script reads public S3 Parquet files from:

```text
https://indian-supreme-court-judgments.s3.amazonaws.com/metadata/parquet/year=YYYY/metadata.parquet
```

The upstream structured schema does not expose a dedicated case-type field across the historical corpus. The importer therefore parses the source `Case No` value embedded in `raw_html` and maps recognised docket formats such as Civil Appeal, Criminal Appeal, SLP, Writ, Review, Contempt, Transfer, Curative, Arbitration, and miscellaneous applications. Records without a defensible docket signal remain `Unclassified`.

The committed import covers 1950-2024 and writes:

- `data/imports/judgments.csv`
- `data/research/sc-judgments-1950-2024.csv`
- `data/research/sc-corpus-summary.json`
- `public/data/sc-corpus-summary.json`

The corpus summary records classified/unclassified counts, classification rate, and the full case-type distribution. The workflow environment must install `pandas` and `pyarrow` before running this importer. PDFs, tar archives, and large raw exports should not be committed to the app repository.

## Delay Estimate Research

Run the delay research step manually:

```bash
npm run research:delay
```

It writes:

- `data/research/sc-delay-field-audit.csv`
- `data/research/sc-delay-estimates.csv`
- `public/data/delay-summary.json`

This output is historical estimated time-to-judgment. It is not exact delay of all cases.

## Run Data Pipeline

```bash
npm run validate
npm run compute
npm run data
```

- `npm run validate` validates import files when present, otherwise validates sample fallback.
- `npm run compute` generates public data files, including the lightweight shared metadata file.
- `npm run data` runs validation and generation together.
- `npm run build` also runs validation and generation before the Next.js build.

If an import file exists but is malformed, validation fails loudly. The app only falls back to sample data when no import file is present.

## Scheduled Refresh

The recurring GitHub Actions workflow is `.github/workflows/regenerate-public-data.yml`.

It runs at 03:17 UTC on the first day of each month and can also be started manually from GitHub Actions. The workflow first attempts to capture a complete NJDG Supreme Court snapshot from the official public dashboard, then refreshes IMLJD rows from the independent Hugging Face/GitHub source, preserves non-IMLJD corpus rows, regenerates public JSON, runs tests/lint/build, and commits changed generated files. If either upstream source is temporarily unavailable, it keeps the relevant committed snapshot instead of downloading the live site's own output or inventing data.

## Generated Files

The data pipeline writes:

- `public/data/justice-clock-data.json`
- `public/data/data-metadata.json`
- `public/data/court-clock.json`
- `public/data/njdg-latest.json`
- `public/data/case-types.json`
- `public/data/judges.json`
- `public/data/judgments.json`
- `public/data/judgment-corpus-summary.json`
- `public/data/delay-summary.json`
- `public/data/research-index.json`
- `public/data/sources.json`
- `public/data/site-summary.json`

The bundled dataset at `public/data/justice-clock-data.json` remains available as a complete generated export. Shared page modules import `data-metadata.json` and the smaller aggregate files instead of statically importing the bundled dataset or full judgment list.

The `/data` judgment explorer queries `/api/judgments`, which reads the committed static judgment JSON on the server and returns only the requested filtered page. The browser does not download `public/data/judgments.json` in full.

Important metadata fields:

- `metadata.sources`: reports whether the court snapshot and judgment records are in `sample` mode or `import` mode, with source paths.
- `metadata.counts`: reports judgment records, case-type groups, and judge profiles.
- `metadata.publicLaunchReady`: `true` only when both source streams are imports, sample mode is off, and judgment records are present.

`npm run build` does not download the corpus or scrape public court sites. Build uses generated/static data already present in the repository. Run import scripts manually or from the scheduled workflow, then run `npm run data:build`.

## Sample Mode

Open `/data` or inspect `public/data/data-metadata.json`.

The app is still in sample mode when:

- `sample` is `true`
- `sources.courtSnapshot.mode` is `sample`
- `sources.judgments.mode` is `sample`

Sample mode is off only when both the court snapshot and judgment records come from imports.

To move from sample mode to import mode:

1. Add `data/imports/court-snapshot.json`.
2. Add `data/imports/judgments.csv` or `data/imports/judgments.json`.
3. Run `npm run data`.
4. Confirm `/data` shows Import for both source streams.
5. Confirm `/launch-checklist` shows Complete for the real-data checks.

## Before Public Launch

Check `/launch-checklist` and confirm:

- Real court snapshot connected
- Real judgment records connected
- Sample mode off
- Judgment records available
- Public JSON bundle generated
- Judgment JSON generated
- Source metadata available
- Methodology visible
- Judge profile caveat visible

## Verification

```bash
npm install
npm audit --audit-level=high
npm run validate
npm run compute
npm test
npm run lint
npm run build
npm run start
```

Acceptance smoke checks:

- `/`, `/data`, `/launch-checklist`, `/judges`, a judge profile, `/case-types`, a case-type profile, `/methodology`, `/sources`, `/about`, and `/research` return HTTP 200.
- `/api/judgments?page=1&pageSize=25` returns at most 25 records and stays below 500KB.
- `/launch-checklist` reports the real-data checks as complete.
- `public/data/case-types.json` contains multiple substantive case types and less than 95% of records are `Unclassified`.
- The homepage displays NJDG civil/criminal pendency, monthly institution/disposal, old-case disposal, and coram-wise values from the committed snapshot.
- `public/data/judgments.json` is generated.
- `public/data/justice-clock-data.json` includes source metadata and record counts.
- Sample fallback remains available.
- Malformed import files fail loudly.

## Safety Notes

- Do not present judge pages as comparative performance lists.
- Do not use blame or defamatory language.
- Use conservative labels: approximate case-age-to-judgment gap, bench-associated metrics, public judgment metadata profiles, source confidence, and generated metrics.

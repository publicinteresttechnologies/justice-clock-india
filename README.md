# Justice Clock India

Justice Clock India is a mobile-first public data website for tracking Supreme Court pendency, case-type delay, and public judgment metadata profiles from repeatable public data.

The app keeps a conservative public-interest tone. Judge pages are public judgment metadata profiles, not performance ratings. Case-age metrics are described as approximate case-age-to-judgment gaps unless exact dates are available.

## Setup

```bash
npm install
npm run data:build
npm run dev
```

The project also works with pnpm, but CI and public setup instructions can use npm scripts.

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

## Optional eCourtsIndia API Adapter

The eCourtsIndia API adapter is an optional private/offline ingestion backend. Treat it as third-party and unverified unless official API documentation proves the endpoint, fields, and terms. Next.js pages must not call the third-party API directly.

The adapter must only import Supreme Court of India public judgment metadata. Do not broaden it to High Courts, District Courts, tribunals, or all-India court data.

Intended flow:

```text
eCourtsIndia API
-> private import script
-> raw saved responses
-> normalized Supreme Court of India records
-> data/imports/judgments.csv
-> npm run data:build
-> public static JSON
-> website
```

Create a private `.env` from `.env.example`:

```bash
ECOURTS_API_KEY=
ECOURTS_API_BASE_URL=https://ecourtsindia.com/api
ECOURTS_IMPORT_LIMIT=100
```

Do not use `NEXT_PUBLIC_` for the API key. It is server/private ingestion configuration only.

Run a dry run:

```bash
npm run import:ecourts -- --dry-run --limit=10
```

Write the normalized import CSV:

```bash
npm run import:ecourts -- --limit=100
npm run data:build
```

The importer saves raw responses under `data/raw/ecourts/` and writes normalized records to `data/imports/judgments.csv` by default. It intentionally requests Supreme Court of India judgment metadata only. Endpoint names and query parameters are placeholders until official API documentation is confirmed, so review `scripts/import-ecourts-api.ts` before first production use.

Files produced by the adapter and data pipeline:

- `data/raw/ecourts/*.json`
- `data/imports/judgments.csv`
- `public/data/judgments.json`
- `public/data/justice-clock-data.json`

## IMLJD Supreme Court Seed Dataset

IMLJD is the Indian Matrimonial Litigation Judgment Dataset, an open research dataset for matrimonial and criminal-family litigation analysis. Its public materials describe 3,613 Indian court judgments in total, including a Supreme Court of India subset of 1,474 cases covering 2000-2024.

Justice Clock India uses IMLJD as the first real-data seed because it provides structured public judgment metadata and a Supreme Court subset that can be normalized into the existing generated metrics pipeline.

Important scope limitation: IMLJD is not full Supreme Court coverage. It is a subject-specific Supreme Court matrimonial/family-related litigation subset. Generated metrics from this seed must be read as subject-specific public judgment metadata, not whole-court metrics.

Run the import:

```bash
npm run import:imljd
npm run data:build
npm run build
```

The importer attempts to load IMLJD from Hugging Face or GitHub, saves the raw source under `data/raw/imljd/`, filters to Supreme Court of India records, excludes Karnataka High Court records, and writes normalized records to `data/imports/judgments.csv`. The IMLJD `case_id` citation is stored in the Justice Clock `caseNumber` column.

If remote download is unavailable, place a local fallback at either:

```text
data/imports/imljd.json
data/imports/imljd.csv
data/imports/imljd/sc_enriched.csv
```

After `npm run data:build`, the bundled metadata includes:

```json
{
  "datasetScope": {
    "name": "IMLJD Supreme Court subset",
    "court": "Supreme Court of India",
    "coverage": "Subject-specific matrimonial/criminal-family litigation subset",
    "years": "2000-2024",
    "fullCourtCoverage": false
  }
}
```

## Add Real Court Snapshot JSON

Create `data/imports/court-snapshot.json`. You can start from:

```text
data/imports/court-snapshot.template.json
```

The court snapshot should include source name, source URL, capture time, reporting period, pending counts, monthly institution/disposal movement, bench-size pending counts, confidence, and notes.

Current court-wide snapshot caveat: the imported Supreme Court snapshot uses the National Judicial Data Grid Supreme Court dashboard total pendency. Civil/criminal split, institution/disposal movement, old-case count, and bench-size split were not available in the captured source. Missing fields are stored as `null` and shown as missing, not estimated.

To normalize the current manually captured snapshot into the public NJDG layer:

```bash
npm run import:njdg
```

This reads `data/imports/court-snapshot.json`, writes `public/data/njdg-latest.json`, and stores a dated snapshot under `data/research/njdg-snapshots/`.

## Supreme Court Corpus Import

The long-form Supreme Court metadata importer is manual/workflow-only. It must not run inside Vercel build.

```bash
npm run import:sc-metadata
```

The script reads public S3 parquet files from:

```text
https://indian-supreme-court-judgments.s3.amazonaws.com/metadata/parquet/year=YYYY/metadata.parquet
```

It writes:

- `data/imports/judgments.csv`
- `data/research/sc-judgments-2000-2024.csv`
- `data/research/sc-corpus-summary.json`
- `public/data/sc-corpus-summary.json`

The workflow environment must install `pandas` and `pyarrow` before running this importer. PDFs, tar archives, and large raw exports should not be committed to the app repository.

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
- `npm run compute` generates public data files.
- `npm run data` runs validation and generation together.
- `npm run build` also runs validation and generation before the Next.js build.

If an import file exists but is malformed, validation fails loudly. The app only falls back to sample data when no import file is present.

## Scheduled Refresh

The repository includes a scheduled GitHub Actions workflow at `.github/workflows/data-refresh.yml`.

It runs the validated data pipeline and production build on a cron schedule and can also be started manually from GitHub Actions. The workflow does not scrape or create source records by itself; it refreshes the generated public JSON files from committed/imported data sources.

## Generated Files

The data pipeline writes:

- `public/data/justice-clock-data.json`
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

The bundled dataset at `public/data/justice-clock-data.json` includes source metadata and record counts.

Important metadata fields:

- `metadata.sources`: reports whether the court snapshot and judgment records are in `sample` mode or `import` mode, with source paths.
- `metadata.counts`: reports judgment records, case-type groups, and judge profiles.
- `metadata.publicLaunchReady`: `true` only when both source streams are imports, sample mode is off, and judgment records are present.

`npm run build` does not download the corpus or scrape public court sites. Build uses the generated/static data already present in the repository. Run import scripts manually or from a scheduled workflow, then run `npm run data:build`.

## Sample Mode

Open `/data` or inspect `public/data/justice-clock-data.json`.

The app is still in sample mode when:

- `metadata.sample` is `true`
- `metadata.sources.courtSnapshot.mode` is `sample`
- `metadata.sources.judgments.mode` is `sample`

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
npm run validate
npm run compute
npm test
npm run lint
npm run build
```

Acceptance smoke checks:

- `/data` renders
- `/launch-checklist` renders
- `public/data/judgments.json` is generated
- `public/data/justice-clock-data.json` includes source metadata and record counts
- Sample fallback remains available
- Malformed import files fail loudly

## Safety Notes

- Do not present judge pages as comparative performance lists.
- Do not use blame or defamatory language.
- Use conservative labels: approximate case-age-to-judgment gap, bench-associated metrics, public judgment metadata profiles, source confidence, and generated metrics.

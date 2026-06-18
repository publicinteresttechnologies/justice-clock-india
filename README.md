# Justice Clock India

A dedicated Supreme Court Justice Clock product.

The public dashboard shows a daily timestamped Supreme Court pendency snapshot with source links, confidence labels, and missing fields displayed honestly.

## Current product

The homepage now focuses on the Supreme Court Justice Clock only:

- total pending cases
- civil pending cases, when available
- criminal pending cases, when available
- institution this month, when available
- disposal this month, when available
- clearance rate, calculated only when institution/disposal are present
- cases older than 5 years, when available
- cases older than 10 years, when available
- source name and source link
- reporting period
- capture timestamp
- extraction/import notes

## Hard rule

The product must not invent unavailable court metrics. Missing fields must render as missing.

## Local setup

```bash
npm install
npm run data:build
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Snapshot update

The court snapshot lives here:

```txt
data/imports/court-snapshot.json
```

Manual update command:

```bash
SOURCE_NAME="Official source name" \
SOURCE_URL="https://official-source-url" \
REPORTING_PERIOD="As of 2026-06-19" \
TOTAL_PENDING="90694" \
npm run snapshot:update
```

Optional fields:

```txt
CIVIL_PENDING
CRIMINAL_PENDING
INSTITUTED_THIS_MONTH
DISPOSED_THIS_MONTH
CASES_OLDER_THAN_5_YEARS
CASES_OLDER_THAN_10_YEARS
CONFIDENCE
SNAPSHOT_NOTE
```

Then rebuild:

```bash
npm run data:build
npm run build
```

## Data pipeline

```bash
npm run data:build
```

Equivalent to:

```bash
npm run validate:data
npm run compute:metrics
```

Generated files are written to:

```txt
public/data/justice-clock-data.json
public/data/court-clock.json
public/data/case-types.json
public/data/judges.json
```

## Current status

The app is wired as a real product shell with an import pipeline. The current Supreme Court pending figure is an interim imported snapshot, not a complete live official ingestion. Missing fields are intentionally omitted rather than estimated.


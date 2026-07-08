# Justice Clock India Technical Due Diligence

## Sources

Justice Clock India separates four source layers:

- NJDG/public dashboard snapshots for current Supreme Court backlog signals.
- Supreme Court of India public judgment metadata for the judgment corpus.
- Generated historical estimated time-to-judgment research files.
- Research posts that explain methods, limitations, and source notes.

The current court-wide snapshot is a manual public snapshot, not an official API integration. Missing fields must remain `null` and visibly missing.

## What Sources Can Support

NJDG/public snapshots can support a dated current backlog snapshot when the source page exposes the field. They cannot support exact live backlog claims between captures.

Judgment metadata can support public judgment metadata profiles, case-type grouping, bench-associated metrics, and estimated historical time-to-judgment research. It cannot support legal advice, case prediction, or responsibility for delay.

Research outputs can support transparent exploratory analysis. Draft posts must not publish unsupported headline numbers.

## Architecture

Manual or workflow-only import scripts write normalized source files under `data/imports/` and research artifacts under `data/research/`.

`npm run data:build` validates imports and generates static JSON under `public/data/`.

The Next.js app reads static JSON only. It does not call third-party court APIs from pages.

## Why PDFs Are Not Committed

Full PDFs, tar archives, and large raw exports can be large, mutable, and operationally unsuitable for a frontend repository. Raw snapshots should live in object storage or workflow artifacts. The repository should commit normalized metadata and compact public JSON outputs.

## Snapshot vs Corpus vs Delay

The live snapshot layer is a dated backlog signal.

The judgment corpus layer is public judgment metadata.

The delay layer is historical estimated time-to-judgment, not exact delay of all cases. Estimates should use the strongest available start signal and report limitations.

## Confidence Rules

High means official source, stable schema, and repeatable capture.

Medium-high means a strong public source with minor limitations.

Medium means useful public metadata with incomplete fields or partial inference.

Low means thin source support or significant missing context.

Experimental means sample, prototype, or unverified generated output.

## Legal And Ethical Risk

Avoid judge bias claims without controls, context, and legal review.

Do not provide legal advice or case prediction.

Do not make exact live backlog claims without an official API or dated official snapshot.

Do not scrape aggressively or bypass access controls.

Judge pages must remain public judgment metadata profiles and not a performance rating.

## Recommended Deployment

Run the Next.js app on Vercel.

Run ingestion jobs in GitHub Actions or an external worker.

Store raw snapshots in object storage.

Store normalized long-term data in Postgres or Supabase when static JSON becomes too large.

Serve compact generated metrics and public summaries as static JSON from `public/data/`.

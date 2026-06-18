# Justice Clock India

Supreme Court Time to Justice Tracker.

Justice Clock India is a mobile-first public data website for tracking Supreme Court pendency, case-type delay, and public judgment metadata profiles.

## Product pillars

1. **Supreme Court Justice Clock**
   - pending cases
   - civil/criminal split
   - institution and disposal movement
   - clearance rate
   - old-case movement

2. **Case-Type Time to Justice**
   - approximate case-age-to-judgment timelines
   - case-type comparison
   - confidence labels

3. **Judge Public Judgment Profiles**
   - authored judgments
   - bench-associated judgments
   - case-type mix
   - old-case involvement
   - no judge ranking at launch

## Important disclaimer

Justice Clock India is an independent public data project. It is not an official Supreme Court website and does not provide legal advice.

Judge pages are public metadata profiles, not performance ratings. Case-age metrics are bench-associated unless explicitly marked as authored or direct.

Where exact filing-to-disposal dates are unavailable, time-to-justice metrics use case year or diary year as an approximation.

## Local setup

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Data imports

The app now supports importable source data.

Optional real-data files:

```txt
data/imports/court-snapshot.json
data/imports/judgments.json
data/imports/judgments.csv
```

If these files exist, the pipeline uses them. If not, it falls back to sample files in `data/seed`.

Templates:

```txt
data/imports/court-snapshot.template.json
data/imports/judgments.template.csv
```

CSV list fields use semicolons:

```txt
judges: Justice A; Justice B
subjectTags: civil; property
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

The app reads from the bundled dataset at:

```txt
/data/justice-clock-data.json
```

The visible data hub is available at:

```txt
/data
```

## CI

GitHub Actions runs the following checks on every push to `main`:

```bash
npm install
npm run validate:data
npm run compute:metrics
npm run build
```

## Current status

This is a complete MVP shell with a real import pipeline, but it still falls back to sample data until verified Supreme Court records are added to `data/imports`.

## Next build steps

1. Add verified Supreme Court judgment records to `data/imports/judgments.csv` or `data/imports/judgments.json`.
2. Add official court snapshot data to `data/imports/court-snapshot.json`.
3. Run `npm run data:build`.
4. Review `/data`, `/case-types`, and `/judges` before public launch.

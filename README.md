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

## Data pipeline

```bash
npm run validate:data
npm run compute:metrics
```

Generated files are written to:

```txt
public/data/court-clock.json
public/data/case-types.json
public/data/judges.json
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

This is a sample-data MVP scaffold. Do not publish sample data as real data.

## Next build steps

1. Replace sample court snapshot with official/generated data.
2. Replace sample judgment records with real judgment metadata.
3. Add real ingestion scripts for local JSON/CSV.
4. Deploy to Vercel after CI passes.

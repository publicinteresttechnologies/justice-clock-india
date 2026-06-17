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

## Current status

This is the initial mobile-first scaffold. It uses sample placeholders only. Do not publish sample data as real data.

## Next build steps

1. Add reusable metric, source, caveat, and confidence components.
2. Add Zod schemas for court snapshots and judgment records.
3. Add seed data.
4. Add metric computation scripts.
5. Replace placeholders with generated JSON data.
6. Add ad-slot infrastructure only after the primary product pages are stable.

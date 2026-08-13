# Upwise replacement package

Drop these files into the root of the existing `aliMalik416/Upwise` repository.

This replacement preserves the existing static/GitHub Pages architecture but upgrades the product into a connected decision system:
- minimal home
- shared profile
- Finance
- Groceries
- Career
- Education
- Worth It?
- Sources/methodology
- About

Profile data is browser-local (`localStorage`) in this version. No backend or secret keys are included.

## Deploy

Replace the old files with this package, commit to `main`, and GitHub Pages will serve the root `index.html`.

The existing repository is already configured around a static no-build architecture and GitHub Pages deployment from `main` root. See the repository README.

## Important data rule

The calculators use user-entered values. External facts are linked to Canadian primary sources. The career score is explicitly a heuristic comparison model, not a probability or forecast. Grocery comparisons do not pretend user-entered prices are live national statistics.

## Next production step

Move the profile/calculation persistence to Supabase/Postgres, then add server-side ingestion for Statistics Canada and Job Bank datasets with a dated source record for every benchmark.

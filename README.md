# Upwise v1 — connected decision toolkit

This is a GitHub Pages-ready static build that turns the original Upwise prototype into a connected product foundation.

## Included

- Minimal homepage and tool finder
- Shared local financial profile
- Finance engine:
  - cash-flow snapshot
  - payday runway
  - affordability / protected-goal check
  - debt amortization scenarios
  - savings goals + milestones
- Grocery engine:
  - budget connection to profile
  - basket comparison
  - deal/unit-price analysis
  - grocery trend visualization
- Career explorer:
  - interest + work-style + study-tolerance + income fit model
  - explicit "comparison model, not prediction" language
  - Canadian labour-market source links
- Education scenario model:
  - direct cost
  - estimated opportunity cost
  - income delta
  - simple payback
  - income-path visualization
- Worth-It decision tool
- Evidence/source page
- Responsive UI with Upwise's cream/sage/gold/peach/coral language
- No framework or build step required

## Important architecture note

This version deliberately keeps data in `localStorage` so it can be deployed immediately on GitHub Pages.

The next production step is to replace the storage adapter with Supabase Auth + Postgres and keep the calculation engine separate from the UI.

## Data integrity

The prototype does NOT pretend that static numbers are live.

- Personal math is calculated from the user's inputs.
- External guidance is linked to primary sources.
- Career fit scores are Upwise heuristics, not validated probabilities.
- Education income changes are scenarios, not forecasts.
- Grocery basket comparisons use the user's reference price unless live/statistical data is explicitly connected.

## Deploy

1. Replace the current `index.html`, `style.css`, `app.js`, and `data/sources.json` with these files.
2. Commit to `main`.
3. GitHub Pages should serve `index.html`.

## Production roadmap

1. Supabase Auth + Postgres
2. User-owned profiles/goals/transactions
3. Server-side data ingestion
4. Scheduled Canadian data refreshes
5. More occupation/program datasets
6. Live grocery/product price integrations
7. Account dashboard
8. Audit trail for every recommendation
9. Accessibility audit
10. Privacy/security review before storing sensitive financial data

# plainlyHuman

**Tools for real life.**

A warm, jargon-free collection of calculators that explain what your numbers actually mean — not just what they are.

## Structure

- `index.html` — homepage
- `start-here.html` — shared profile (saves to browser localStorage, auto-fills other tools)
- `finance.html` — Survive Until Payday, Take-Home Pay, Debt Payoff, Car Costs, Rent Affordability, Move Out, Investment Growth
- `work.html` — Raise Calculator, Overtime Calculator, Side-Hustle Profit, Can I Quit My Job?
- `school.html` — Student Budget
- `worth.html` — What's It Worth? (comp-based valuation tool)
- `deals-groceries.html` — Grocery Budget, Credit Card Rewards Calculator
- `about.html`, `how-we-make-money.html` — footer pages
- `style.css` — shared design system (cream/sage/peach/gold, Fraunces + Work Sans)

## Running locally

No build step — just open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Hosting on GitHub Pages

Settings → Pages → Deploy from branch → `main` → `/ (root)`.

## Principle

Every core tool stays free. Affiliate links and ads never change what a tool recommends — see `how-we-make-money.html`.

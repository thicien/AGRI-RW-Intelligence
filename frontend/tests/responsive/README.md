# Responsive verification

Run from `frontend` after installing dependencies:

```powershell
npm run build
npm run test:responsive
```

The suite launches the production preview at `127.0.0.1:4173` and uses installed Google Chrome (`channel: chrome`). It checks 50 routed pages at 320, 390, 768, 1024, 1280, 1366, and 1920 pixels. It also checks drawer focus trapping, Escape dismissal, route selection, orientation changes, touch targets, table scrolling, dialogs, and short landscape login.

Requests are isolated from external services. Production explorer tests use explicit synthetic agricultural records. Other unavailable services return an intentional 503 so their empty and failure states can be checked without credentials. Optional read-only API response snapshots can be supplied as `test-results/layout-fixtures.json`, keyed by API pathname (for example `/api/v1/crop-statistics/decision-workspace`), to exercise populated agricultural dashboards. Snapshots and browser artifacts are ignored by Git; no live data is published by the tests.

Charts use their existing responsive containers. Dense tables retain semantic table markup inside keyboard-focusable horizontal scroll regions. Navigation uses a drawer below 1280 pixels and a persistent sidebar above that breakpoint.

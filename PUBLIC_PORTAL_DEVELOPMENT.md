# Running the public portal locally

Use two terminals in this checkout:

```powershell
cd backend
npm run start:dev
```

```powershell
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:3000/api/v1`. Backend watch mode reloads changed controllers and services. A previously started `node dist/main` process can continue serving an older build and return 404 for newly added explorer endpoints; restart the matching backend rather than replacing unavailable data with sample numbers.

Check the actual running API after changes:

```powershell
cd backend
npm run verify:public-portal
```

This checks the HTTP routes and JSON contracts for production, irrigation, soil source tables, post-harvest and trade. It performs read requests only. A 404 indicates that the running backend does not include the route; other HTTP or schema failures are reported separately.

Production builds use the public API URL configured in `frontend/.env.production`; local Vite development uses the local API unless overridden. Updating local code does not deploy the hosted backend.

Soil observation rows are separate from district summaries. Sampling footprint hectares are unavailable unless explicitly recorded. Soil change calculations require matched sites, methods, units, depths and distinct dates; summaries alone do not establish a seasonal change.

## Source-backed seasonal soil tables

Run these read-only extraction and verification steps from `backend` when source files change:

```powershell
node scripts/build-public-soil-evidence.js
node scripts/verify-soil-source-evidence.js
```

The generator reads every original workbook and PDF in `data/agriculture` and writes a versioned TypeScript data artifact to `src/soil-fertility/seasonal-soil-evidence.ts`. It does not alter the database. The current audit covers 43 files (15 workbooks and 28 PDFs), 50,024 original workbook cells and 66,066 usable source cells in total. Source tables cover all 30 districts; explicit source seasons span 2018A through 2026B with gaps. Other system seasons remain selectable and show a coverage notice rather than substituted estimates. Some earlier reports publish strata instead of district data. PDF extraction is partial: uncertain column alignments, missing-cell compaction and unrecognized headers are rejected. All source-file hashes and extraction statuses are downloadable.

The public API returns the source catalog separately from selected series cells, so phones do not download the full dataset. Selecting a publication prevents duplicate annual and seasonal tables from being summed together. Each workbook cell is checked against the original file by the verification script. A source series has at most one value for each district. Comparisons require matching headers, source definitions and units; they describe reporting changes, not treatment effects.

The National Agricultural Planner soil summary table was populated with year-scaled baseline practices and static district profiles. Its full 30-district, 38-season model context remains accessible under **Soil observations & planner context**, separately from original source tables and recorded observations. Those profiles are not repeated laboratory measurements.

## Post-harvest and export evidence

`post-harvest/public-explorer` exposes seasonal district **model estimates**, an undated facility registry, and separately sourced crop production. Crop- and facility-type-specific seasonal capacities are unavailable without explicit links. Facility coordinates are plotted as stored; no district-centre location is inferred. Capacity, throughput and utilization are distinct.

`trade/public-explorer` exposes all crop production, modelled national trade scenarios and modelled district surplus. The existing trade seed script generates quantities, values and destinations from assumptions. Therefore actual shipment quantities, export earnings, destination shares and documented crop-specific export supply remain unavailable. No national export total is allocated to a district. Facilities qualify as export support only with an explicit export role.

Run local integration checks from `frontend` while both dev servers are running:

```powershell
node node_modules/@playwright/test/cli.js test public-expansion.spec.ts
```

These use the actual app at `localhost:5173`, verify filter isolation and original-source coverage, and check all three explorers at 320, 390, 768, 1024, 1280, 1366 and 1920 pixels. The production preview uses `.env.production` and may target the hosted API instead.

## Public release navigation and counts

The public header is a single sticky logo row with Login and Back to home links. Topic selection remains in the five topic cards. The duplicate header navigation, green banner and public-versus-authorized-workspace comparison block have been removed.

The storage overview counts actual distinct registry rows (97 in the current database) and sums registered capacity. Seasonal model counts (77 nationally in the illustrated period) remain separately labelled in the seasonal analysis. Matching registry counts obey geography, documented commodity linkage and facility type; hiding the directory does not change registry totals.

Public export profiles now include the planner's 380 commodity-season scenarios and 1,140 district-season supply profiles, alongside all 18,432 crop production records. Reference markets are presented without invented destination allocations. All-season source downloads preserve source/dataset and stored data-quality metadata. Missing source links stay blank. Baseline estimates remain distinct from customs measurements.

The backend no longer kills an arbitrary process occupying its port at startup. Stop the specific older backend before starting another instance; production builds can stop a Nest watch child, so restart the development watcher after building when required.

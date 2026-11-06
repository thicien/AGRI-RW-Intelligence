import { useEffect, useState } from "react";
import API_BASE_URL from "../../../config/api";
import SoilExplorer from "./SoilExplorer";
import PublicChoropleth from "../components/PublicChoropleth";
import { DISTRICT_PROVINCES } from "../publicPortalApi";
import {
  Panel,
  Notice,
  Stats,
  Field,
  DataTable,
  Chart,
  CsvButton,
  ChartExport,
  buttonClass,
  controlClass,
  format,
  sum,
} from "../components/EvidenceUI";
interface Series {
  id: string;
  season_code: string | null;
  year: number;
  indicator: string;
  header: string;
  unit: string;
  source: string;
  sheet: string;
  period_note: string;
  source_column?: string;
}
interface Cell {
  series_id: string;
  district: string;
  value: number;
  cell: string;
}
interface Audit {
  source: string;
  format?: string;
  status: string;
  records: number;
  sha256: string;
  pages?: number;
}
export default function SoilPortal({
  initialDistrict = "ALL",
  onDistrictChange,
}: {
  initialDistrict?: string;
  onDistrictChange: (name: string) => void;
}) {
  const [view, setView] = useState("sources");
  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Soil evidence views"
        className="flex flex-wrap gap-2"
      >
        <button
          role="tab"
          aria-selected={view === "sources"}
          className={buttonClass}
          onClick={() => setView("sources")}
        >
          Seasonal district statistics
        </button>
        <button
          role="tab"
          aria-selected={view === "observations"}
          className={buttonClass}
          onClick={() => setView("observations")}
        >
          Soil observations & planner context
        </button>
      </div>
      {view === "sources" ? (
        <SeasonalSoil
          initialDistrict={initialDistrict}
          onDistrictChange={onDistrictChange}
        />
      ) : (
        <SoilExplorer
          initialDistrict={initialDistrict}
          onDistrictChange={onDistrictChange}
        />
      )}
    </div>
  );
}
function SeasonalSoil({
  initialDistrict,
  onDistrictChange,
}: {
  initialDistrict: string;
  onDistrictChange: (name: string) => void;
}) {
  const [configuredPeriods, setConfiguredPeriods] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Series[]>([]),
    [audit, setAudit] = useState<Audit[]>([]),
    [methodology, setMethodology] = useState(""),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [ready, setReady] = useState(false);
  const [period, setPeriod] = useState(""),
    [seriesId, setSeriesId] = useState(""),
    [district, setDistrict] = useState(initialDistrict),
    [province, setProvince] = useState("ALL"),
    [compare, setCompare] = useState(""),
    [cells, setCells] = useState<Cell[]>([]),
    [previous, setPrevious] = useState<Cell[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setError(false);
    setReady(false);
    fetch(API_BASE_URL + "/soil-fertility/public-source-tables", {
      signal: c.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (!Array.isArray(d.series) || !Array.isArray(d.audit)) throw Error();
        setCatalog(d.series);
        setConfiguredPeriods(Array.isArray(d.periods) ? d.periods : []);
        setAudit(d.audit);
        setMethodology(d.methodology);
        const latest =
          d.series
            .map((s: Series) => s.season_code)
            .filter(Boolean)
            .sort()
            .at(-1) || "UNASSIGNED";
        setPeriod(latest);
        const first =
          d.series.find(
            (s: Series) =>
              s.season_code === latest &&
              /erosion control/i.test(s.header) &&
              s.unit === "ha",
          ) || d.series.find((s: Series) => s.season_code === latest);
        setSeriesId(first?.id || "");
        setReady(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => c.abort();
  }, [retry]);
  const selected = catalog.find((s) => s.id === seriesId);
  const metricKey = (s: Series) =>
    (s.indicator + "|" + s.header)
      .toLowerCase()
      .replace(/(?:summary\s*)?table\s*[\d.]+[:.]?/g, "")
      .replace(/20\d\d|season\s*[abc]/gi, "")
      .replace(/[^a-z]+/g, " ")
      .trim();
  const comparisons = selected
    ? catalog.filter(
        (s) =>
          s.id !== seriesId &&
          s.unit === selected.unit &&
          metricKey(s) === metricKey(selected) &&
          s.season_code &&
          s.season_code !== selected.season_code,
      )
    : [];
  useEffect(() => {
    if (!seriesId) {
      setCells([]);
      setPrevious([]);
      setBusy(false);
      return;
    }
    const c = new AbortController();
    setBusy(true);
    setCells([]);
    setPrevious([]);
    setError(false);
    Promise.all(
      [seriesId, compare].filter(Boolean).map((id) =>
        fetch(
          API_BASE_URL +
            "/soil-fertility/public-source-tables?series=" +
            encodeURIComponent(id),
          { signal: c.signal },
        ).then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        }),
      ),
    )
      .then((d) => {
        if (!d.every((a) => Array.isArray(a.records))) throw Error();
        setCells(d[0].records);
        setPrevious(d[1]?.records || []);
        setBusy(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(true);
          setBusy(false);
        }
      });
    return () => c.abort();
  }, [seriesId, compare, retry]);
  const geography = (name: string) =>
    (district === "ALL" || name === district) &&
    (province === "ALL" || DISTRICT_PROVINCES[name] === province);
  const rows = cells.filter((r) => geography(r.district));
  const before = new Map(previous.map((r) => [r.district, r.value]));
  const sorted = [...rows].sort((a, b) => b.value - a.value),
    districts = Object.keys(DISTRICT_PROVINCES).sort();
  const periods = [
    ...new Set([
      ...configuredPeriods,
      ...catalog.map((s) => s.season_code || "UNASSIGNED"),
    ]),
  ]
    .sort()
    .reverse();
  const available = catalog.filter(
    (s) => (s.season_code || "UNASSIGNED") === period,
  );
  const fileOptions = [...new Set(available.map((s) => s.source))];
  const source = selected?.source || "";
  const activeSources = available.filter((s) => s.source === source);
  const sheetOptions = [...new Set(activeSources.map((s) => s.sheet))];
  const csvColumns = [
    "District",
    "Province",
    "Reporting season",
    "Indicator",
    "Value",
    "Unit",
    "Source",
    "Table",
    "Source cell",
    "Comparison value",
    "Difference (same unit)",
  ];
  const csvRows = rows.map((r) => [
    r.district,
    DISTRICT_PROVINCES[r.district],
    selected?.season_code,
    selected?.header,
    r.value,
    selected?.unit,
    selected?.source,
    selected?.sheet,
    r.cell,
    before.get(r.district) ?? null,
    before.has(r.district) ? r.value - before.get(r.district)! : null,
  ]);
  if (error && !ready)
    return (
      <Panel title="Seasonal soil data could not be loaded">
        <button className={buttonClass} onClick={() => setRetry(retry + 1)}>
          Retry soil source data
        </button>
      </Panel>
    );
  if (!ready)
    return (
      <p role="status" className="p-6">
        Loading original seasonal soil tables...
      </p>
    );
  return (
    <div className="space-y-6">
      <Panel
        title="National Soil & Fertility Overview"
        note="Explore original fertilizer, erosion and agricultural-practice tables covering all 30 districts. These indicators describe management practices and erosion reporting; they do not replace soil laboratory tests."
      >
        <Stats
          items={[
            {
              label: "Districts in original tables",
              value: String(
                new Set(catalog.length ? cells.map((r) => r.district) : [])
                  .size,
              ),
              detail: "Current source series, before geographic filters",
            },
            {
              label: "Explicit seasonal periods",
              value: String(
                new Set(catalog.map((s) => s.season_code).filter(Boolean)).size,
              ),
              detail:
                "Explicit source-table periods; unassigned periods remain separate",
            },
            {
              label: "Selected district records",
              value: String(rows.length),
              detail: selected?.season_code || "Season not explicit",
            },
            {
              label:
                selected?.unit === "ha"
                  ? "Reported area (ha)"
                  : "Measurement unit",
              value:
                selected?.unit === "ha"
                  ? format(sum(rows.map((r) => r.value)))
                  : selected?.unit || "Not available",
              detail:
                selected?.unit === "ha"
                  ? "Sum of selected district records"
                  : "Percentages retain the original source denominator",
            },
          ]}
        />
      </Panel>
      <Panel
        title="Production-season soil & fertility filters"
        note="Choose the source table and measure explicitly. Separate publications are never added together. All results below follow this selection."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Agricultural year and season">
            <select
              className={controlClass}
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setCompare("");
                setSeriesId(
                  catalog.find(
                    (s) => (s.season_code || "UNASSIGNED") === e.target.value,
                  )?.id || "",
                );
              }}
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p === "UNASSIGNED" ? "Season not explicit" : p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source publication">
            <select
              className={controlClass}
              value={source}
              onChange={(e) => {
                setSeriesId(
                  available.find((s) => s.source === e.target.value)?.id || "",
                );
                setCompare("");
              }}
            >
              {!fileOptions.length && (
                <option value="">
                  No structured source table for this season
                </option>
              )}
              {fileOptions.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Source table">
            <select
              className={controlClass}
              value={selected?.sheet || ""}
              onChange={(e) => {
                setSeriesId(
                  activeSources.find((s) => s.sheet === e.target.value)?.id ||
                    "",
                );
                setCompare("");
              }}
            >
              {sheetOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Soil & fertility measure">
            <select
              className={controlClass}
              value={seriesId}
              onChange={(e) => {
                setSeriesId(e.target.value);
                setCompare("");
              }}
            >
              {activeSources
                .filter((s) => s.sheet === selected?.sheet)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.header}
                    {s.source_column ? ` (column ${s.source_column})` : ""}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Province">
            <select
              className={controlClass}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setDistrict("ALL");
                onDistrictChange("ALL");
              }}
            >
              <option value="ALL">All provinces</option>
              {[...new Set(Object.values(DISTRICT_PROVINCES))]
                .sort()
                .map((p) => (
                  <option key={p}>{p}</option>
                ))}
            </select>
          </Field>
          <Field label="District">
            <select
              className={controlClass}
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                onDistrictChange(e.target.value);
              }}
            >
              <option value="ALL">All districts</option>
              {districts
                .filter(
                  (d) =>
                    province === "ALL" || DISTRICT_PROVINCES[d] === province,
                )
                .map((d) => (
                  <option key={d}>{d}</option>
                ))}
            </select>
          </Field>
          <Field label="Comparison source period">
            <select
              className={controlClass}
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            >
              <option value="">No comparison</option>
              {comparisons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.season_code} | {s.source} | {s.sheet}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-4 break-words text-sm text-slate-600">
          {selected?.indicator}
        </p>
      </Panel>
      {!available.length && (
        <Notice>
          No structured district soil or fertility table is available for{" "}
          {period}. This period remains visible because it exists in the system.
          Planner model summaries can be explored separately; they are not
          substituted as measurements.
        </Notice>
      )}
      {error && (
        <Notice>
          Source cells could not be loaded.{" "}
          <button className={buttonClass} onClick={() => setRetry(retry + 1)}>
            Retry source cells
          </button>
        </Notice>
      )}
      {busy ? (
        <p role="status">Loading selected source cells...</p>
      ) : (
        <>
          <Panel
            title="District soil & fertility statistics"
            note={`${selected?.season_code || "Unassigned season"} | ${selected?.unit}. Values are original source cells. Differences in survey coverage or definitions can affect comparisons.`}
          >
            <DataTable
              label="district soil statistics"
              columns={[
                "District",
                "Value (" + (selected?.unit || "") + ")",
                "Comparison",
                "Change (same unit)",
                "Source cell",
              ]}
              rows={rows.map((r) => [
                r.district,
                r.value,
                before.get(r.district) ?? null,
                before.has(r.district)
                  ? r.value - before.get(r.district)!
                  : null,
                r.cell,
              ])}
            />
          </Panel>
          <Panel
            title="Seasonal soil & fertility comparisons"
            note="Compare the selected source measure across two explicitly labelled periods. Percentage measurements require a selected district; national hectare totals use only districts represented in both periods. Differences describe reporting, not a causal effect of soil treatment."
          >
            {compare ? (
              <>
                <Chart
                  line
                  unit={selected?.unit || ""}
                  rows={[
                    {
                      name:
                        catalog.find((s) => s.id === compare)?.season_code ||
                        "Comparison",
                      value:
                        selected?.unit === "ha"
                          ? sum(
                              rows
                                .filter((r) => before.has(r.district))
                                .map((r) => before.get(r.district)!),
                            )
                          : district !== "ALL"
                            ? (before.get(district) ?? null)
                            : null,
                    },
                    {
                      name: selected?.season_code || "Current",
                      value:
                        selected?.unit === "ha"
                          ? sum(
                              rows
                                .filter((r) => before.has(r.district))
                                .map((r) => r.value),
                            )
                          : district !== "ALL"
                            ? (rows.find((r) => r.district === district)
                                ?.value ?? null)
                            : null,
                    },
                  ]}
                />
                <p className="mt-3 break-words text-xs text-slate-600">
                  Comparison source:{" "}
                  {catalog.find((s) => s.id === compare)?.source} |{" "}
                  {catalog.find((s) => s.id === compare)?.sheet}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                Choose a comparison source period to examine the same reported
                indicator. Different headers, units and source definitions are
                not combined.
              </p>
            )}
          </Panel>
          <Panel
            id="soil-source-chart"
            title="District comparison"
            note="Rankings describe the selected reported indicator. A larger fertilizer percentage or erosion value is not a general soil-quality score."
          >
            <Chart
              rows={sorted.map((r) => ({ name: r.district, value: r.value }))}
              unit={selected?.unit || ""}
            />
          </Panel>
          <Panel
            title="Rwanda seasonal soil & fertility map"
            note="Click a district to focus all results. Grey districts have no matching source cell."
          >
            <PublicChoropleth
              title={selected?.header || "Soil & fertility"}
              unit={selected?.unit || ""}
              data={rows.map((r) => ({ name: r.district, value: r.value }))}
              selectedDistrict={district}
              allowedDistricts={districts.filter(
                (d) => province === "ALL" || DISTRICT_PROVINCES[d] === province,
              )}
              onSelectDistrict={(d) => {
                setDistrict(d);
                onDistrictChange(d);
              }}
            />
          </Panel>
        </>
      )}
      <Panel
        id="soil-downloads"
        title="Data and Download Center"
        note="Downloads retain the source publication, table, cell, unit and reporting period."
      >
        <div className="flex flex-wrap gap-3">
          <CsvButton
            name={`soil-fertility-${period}-${district}.csv`}
            columns={csvColumns}
            rows={busy ? [] : csvRows}
            label="Download filtered soil statistics"
          />
          <ChartExport
            available={!busy && rows.length > 0}
            id="soil-source-chart"
            name={"soil-fertility-" + period}
          />
          <CsvButton
            name="soil-source-coverage.csv"
            columns={[
              "Source",
              "Format",
              "Audit status",
              "Extracted cells",
              "SHA-256",
            ]}
            rows={audit.map((a) => [
              a.source,
              a.format,
              a.status,
              a.records,
              a.sha256,
            ])}
            label="Download source coverage audit"
          />
        </div>
      </Panel>
      <Panel
        id="soil-sources"
        title="Sources, coverage and methodology"
        note={methodology}
      >
        <Notice>
          {audit.length} source files reviewed. All original workbooks were
          parsed, and PDF text was reviewed. PDF tables with partial extraction
          or awaiting structured extraction are identified below. Ambiguous or
          compacted rows are excluded rather than shifted into the wrong
          columns. Planner summaries cover 38 seasons but contain
          baseline-scaled estimates; they are available separately under Soil
          observations & planner context. No soil pH or nutrient result is
          manufactured for an untested district or season.
        </Notice>
        <DataTable
          label="soil source coverage"
          columns={[
            "Publication",
            "Format",
            "Extraction status",
            "Source cells",
          ]}
          rows={audit.map((a) => [
            a.source,
            a.format,
            a.status.replaceAll("_", " "),
            a.records,
          ])}
        />
      </Panel>
    </div>
  );
}

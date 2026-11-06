import { useEffect, useMemo, useState } from "react";
import {
  Leaf,
  Filter,
  FlaskConical,
  MapPin,
  Download,
  RefreshCw,
  Info,
  ArrowUpDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import API_BASE_URL from "../../../config/api";
import ResponsiveTable from "../../../components/ResponsiveTable";
import PublicChoropleth from "../components/PublicChoropleth";
import SoilCategoryMap from "../components/SoilCategoryMap";
import { downloadPublicCsv } from "../publicDownloads";
import {
  soilNumber,
  soilGeography,
  soilProtocol,
  soilCatalog,
  selectedSoilObservations,
  selectedSoilSummaries,
  soilDistrictResults,
  canOrderSoil,
  soilChange,
  PRACTICES,
} from "../soilModel";
import type {
  SoilPayload,
  SoilScope,
  SoilSource,
  SoilObservation,
} from "../soilModel";
import { summarize as summarizeProduction } from "../productionModel";
const panel =
  "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm";
const control =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 disabled:opacity-40";
const format = (n: number | null, digits = 2) =>
  n === null
    ? "Not available"
    : n.toLocaleString("en-GB", { maximumFractionDigits: digits });
const empty: SoilPayload = {
  observations: [],
  summaries: [],
  production: [],
  methodology: {},
};
const palette = [
  "#0e7490",
  "#7c3aed",
  "#c2410c",
  "#0369a1",
  "#a16207",
  "#475569",
];
const text = (value: string | null | undefined) => value || "Not recorded";

export default function SoilExplorer({
  initialDistrict = "ALL",
  onDistrictChange,
}: {
  initialDistrict?: string;
  onDistrictChange?: (name: string) => void;
}) {
  const [data, setData] = useState<SoilPayload>(empty),
    [status, setStatus] = useState<"loading" | "ready" | "error">("loading"),
    [retry, setRetry] = useState(0);
  const [source, setSource] = useState<SoilSource>("observations"),
    [indicator, setIndicator] = useState("SOIL_PH");
  const [season, setSeason] = useState(""),
    [compare, setCompare] = useState(""),
    [province, setProvince] = useState("ALL"),
    [district, setDistrict] = useState(initialDistrict);
  const [category, setCategory] = useState("ALL"),
    [protocol, setProtocol] = useState("ALL"),
    [ascending, setAscending] = useState(false),
    [query, setQuery] = useState("");
  const [practice, setPractice] = useState("erosion_control_ha"),
    [expandedHistory, setExpandedHistory] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`${API_BASE_URL}/soil-fertility/public-explorer`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Soil API request failed: " + res.status);
        return res.json();
      })
      .then((raw: SoilPayload) => {
        if (
          ![raw.observations, raw.summaries, raw.production].every(
            Array.isArray,
          )
        )
          throw new Error("Invalid soil response");
        const normal: SoilPayload = {
          ...raw,
          observations: raw.observations.map((r) => ({
            ...r,
            value: soilNumber(r.value),
            depth: soilNumber(r.depth),
          })),
          summaries: raw.summaries.map((r) => ({
            ...r,
            cultivated: soilNumber(r.cultivated),
            practices: Object.fromEntries(
              Object.entries(r.practices || {}).map(([key, value]) => [
                key,
                soilNumber(value),
              ]),
            ),
          })),
          production: raw.production.map((r) => ({
            ...r,
            production: soilNumber(r.production),
            area: soilNumber(r.area),
            harvested: soilNumber(r.harvested),
          })),
        };
        if (controller.signal.aborted) return;
        setData(normal);
        const initialSource: SoilSource = normal.observations.some(
          (r) => r.season_code,
        )
          ? "observations"
          : "summaries";
        setSource(initialSource);
        const codes = [
          ...new Set(
            (initialSource === "observations"
              ? normal.observations
              : normal.summaries
            )
              .map((r) => r.season_code)
              .filter((v): v is string => !!v),
          ),
        ]
          .sort()
          .reverse();
        setSeason(codes[0] || "");
        const catalog = soilCatalog(normal, initialSource);
        setIndicator(
          catalog.some((i) => i.code === "SOIL_PH")
            ? "SOIL_PH"
            : catalog[0]?.code || "",
        );
        setCompare("");
        setStatus("ready");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [retry]);
  const catalog = useMemo(() => soilCatalog(data, source), [data, source]);
  const selected = catalog.find((i) => i.code === indicator);
  const seasons = [
    ...new Set(
      [...data.observations, ...data.summaries]
        .map((r) => r.season_code)
        .filter((v): v is string => !!v),
    ),
  ]
    .sort()
    .reverse();
  const sourcePeriods = [
    ...new Set(
      (source === "observations" ? data.observations : data.summaries)
        .map((r) => r.season_code)
        .filter((v): v is string => !!v),
    ),
  ]
    .sort()
    .reverse();
  const geographicRows = [...data.observations, ...data.summaries];
  const provinces = [
    ...new Set(geographicRows.map((r) => r.province).filter(Boolean)),
  ].sort();
  const allowedDistricts = [
    ...new Set(
      geographicRows
        .filter((r) => province === "ALL" || r.province === province)
        .map((r) => r.district),
    ),
  ].sort();
  const scope: SoilScope = {
    source,
    indicator,
    province,
    district,
    category,
    protocol,
  };
  const observations = selectedSoilObservations(data, scope, season),
    summaries = selectedSoilSummaries(data, scope, season);
  const rows = soilDistrictResults(data, scope, season),
    previousRows = compare ? soilDistrictResults(data, scope, compare) : [];
  const before = new Map(previousRows.map((r) => [r.name, r]));
  const results = rows
    .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (selected?.kind === "category")
        return (
          (a.category || "").localeCompare(b.category || "") *
          (ascending ? 1 : -1)
        );
      if (a.value === null) return b.value === null ? 0 : 1;
      if (b.value === null) return -1;
      return (a.value - b.value) * (ascending ? 1 : -1);
    });
  const hasValue = rows.filter((r) => r.value !== null || r.category !== null);
  const ordered =
    canOrderSoil(data, scope, season) && selected?.kind === "numeric";
  const units = [...new Set(observations.map((r) => r.unit).filter(Boolean))];
  const unit =
    source === "observations" && units.length === 1
      ? units[0]!
      : selected?.unit || "";
  const documentedUnit =
    source === "observations"
      ? units.length === 1 && observations.every((r) => !!r.unit)
      : selected?.documentedUnit;
  const metricLabel =
    source === "observations"
      ? "Recorded observation median"
      : "Stored district summary";
  const sourceLabel =
    source === "observations"
      ? "Observation records"
      : "Planner model summaries";
  const location =
    district !== "ALL"
      ? `${district} District`
      : province !== "ALL"
        ? province
        : "Rwanda";
  const scopeLabel = `${location} | ${season || "No period"} | ${selected?.name || "No indicator"} | ${sourceLabel}`;
  const protocolOptions = [
    ...new Map(
      data.observations
        .filter((r) => r.indicator === indicator && soilGeography(r, scope))
        .map((r) => [soilProtocol(r), r]),
    ).entries(),
  ]
    .filter(([key]) => key !== null)
    .map(([key, r]) => ({
      key: key!,
      name: `${r.method} | ${r.depth} cm | ${r.unit}`,
    }));
  const categoryOptions =
    source === "summaries" && selected?.kind === "category"
      ? [
          ...new Set(
            data.summaries
              .filter(
                (r) => r.season_code === season && soilGeography(r, scope),
              )
              .map((r) => r.properties[indicator])
              .filter((v): v is string => typeof v === "string" && !!v),
          ),
        ].sort()
      : source === "observations"
        ? [
            ...new Set(
              data.observations
                .filter(
                  (r) =>
                    r.indicator === indicator &&
                    r.season_code === season &&
                    soilGeography(r, scope),
                )
                .map((r) => r.category)
                .filter((v): v is string => !!v),
            ),
          ].sort()
        : [];
  const historical = sourcePeriods
    .slice()
    .sort()
    .flatMap((period) =>
      soilDistrictResults(data, scope, period).map((r) => ({ period, ...r })),
    );
  const shownHistorical = expandedHistory ? historical : historical.slice(-30);
  const selectedTrajectory =
    district !== "ALL"
      ? soilChange(
          rows.find((r) => r.name === district),
          before.get(district),
        )
      : null;
  const trajectory = selectedTrajectory?.pairs.length
    ? [
        {
          name: compare,
          ...Object.fromEntries(
            selectedTrajectory.pairs.map((p, i) => ["site" + i, p.previous]),
          ),
        },
        {
          name: season,
          ...Object.fromEntries(
            selectedTrajectory.pairs.map((p, i) => ["site" + i, p.current]),
          ),
        },
      ]
    : [];
  const cohort = new Set(rows.map((r) => r.name));
  const practiceRows = data.summaries.filter(
    (r) =>
      r.season_code === season &&
      soilGeography(r, scope) &&
      cohort.has(r.district),
  );
  const practiceBefore = new Map(
    data.summaries
      .filter((r) => r.season_code === compare && soilGeography(r, scope))
      .map((r) => [r.district, r]),
  );
  const practiceInfo = PRACTICES[practice];
  const categoryDomain = [
    ...new Set(
      (source === "summaries"
        ? data.summaries.map((r) => r.properties[indicator])
        : data.observations
            .filter((r) => r.indicator === indicator)
            .map((r) => r.category)
      ).filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      ),
    ),
  ].sort();
  const categories = [
    ...new Set(rows.map((r) => r.category).filter((v): v is string => !!v)),
  ].map((name) => ({
    name,
    count: rows.filter((r) => r.category === name).length,
  }));
  const production = data.production.filter(
    (r) =>
      r.season_code === season &&
      soilGeography(r, scope) &&
      cohort.has(r.district),
  );
  const productionRows = rows.map((r) => ({
    soil: r,
    production: summarizeProduction(
      production.filter((p) => p.district === r.name),
    ),
  }));
  const missingDistricts = allowedDistricts.filter(
    (name) =>
      (district === "ALL" || district === name) &&
      !hasValue.some((r) => r.name === name),
  );
  const mapData = rows.map((r) => ({
    name: r.name,
    value:
      source === "observations" && !ordered
        ? null
        : documentedUnit
          ? r.value
          : null,
  }));
  const mapPrevious = previousRows.map((r) => ({
    name: r.name,
    value:
      r.unit !== unit ||
      (source === "observations" && !canOrderSoil(data, scope, compare))
        ? null
        : documentedUnit
          ? r.value
          : null,
  }));
  const mapValues = [...mapData, ...mapPrevious]
    .map((r) => r.value)
    .filter((v): v is number => v !== null);
  const mapMaximum = mapValues.length ? Math.max(...mapValues) : null;
  const updateDistrict = (name: string) => {
    setDistrict(name);
    onDistrictChange?.(name);
  };
  const updateSeason = (code: string) => {
    setSeason(code);
    setCategory("ALL");
    if (code === compare) setCompare("");
  };
  const changeSource = (value: SoilSource) => {
    setSource(value);
    setCategory("ALL");
    setProtocol("ALL");
    const list = soilCatalog(data, value);
    if (!list.some((r) => r.code === indicator))
      setIndicator(list[0]?.code || "");
  };
  const exportRows = () =>
    downloadPublicCsv(
      `agrilens-soil-${source}-${indicator}-${season}-${district}.csv`,
      source === "observations"
        ? [
            [
              "Period",
              "District",
              "Province",
              "Indicator",
              "Value",
              "Category",
              "Unit",
              "Observation date",
              "Depth (cm)",
              "Method",
              "Geographic resolution",
              "Source",
              "Dataset",
              "Version",
            ],
            ...observations.map((r) => [
              r.season_code,
              r.district,
              r.province,
              r.indicator,
              r.value,
              r.category,
              r.unit,
              r.observed_at,
              r.depth,
              r.method,
              r.geographic_resolution,
              r.source_name,
              r.dataset_name,
              r.dataset_version,
            ]),
          ]
        : [
            [
              "Period",
              "District",
              "Province",
              "Indicator",
              "Value",
              "Unit",
              "Evidence",
              "Observation count",
              "Sampling method",
              "Sampling depth",
              "Source references",
            ],
            ...rows.map((r) => [
              season,
              r.name,
              r.province,
              indicator,
              selected?.kind === "category" ? r.category : r.value,
              r.unit,
              r.source,
              null,
              null,
              null,
              summaries.find((s) => s.district === r.name)?.sources?.join("; "),
            ]),
          ],
    );
  const exportComparisons = () =>
    downloadPublicCsv(
      `agrilens-soil-district-comparison-${season}-${compare || "none"}.csv`,
      [
        [
          "Period",
          "Comparison period",
          "District",
          "Indicator",
          "Value",
          "Baseline value",
          "Unit",
          "Baseline unit",
          "Observation rows",
          "Baseline observation rows",
          "Matched sites",
          "Paired-site difference",
          "Comparability",
          "Evidence",
        ],
        ...results.map((r) => {
          const b = before.get(r.name),
            change = soilChange(r, b);
          return [
            season,
            compare,
            r.name,
            indicator,
            r.value ?? r.category,
            b?.value ?? b?.category ?? null,
            r.unit,
            b?.unit ?? null,
            r.count,
            b?.count ?? null,
            change.matched,
            change.change,
            change.reason,
            r.source,
          ];
        }),
      ],
    );
  const exportHistory = () =>
    downloadPublicCsv(`agrilens-soil-history-${indicator}-${district}.csv`, [
      [
        "Period",
        "District",
        "Province",
        "Indicator",
        "Value",
        "Unit",
        "Observation rows",
        "Dates",
        "Method/depth/unit protocols",
        "Evidence",
      ],
      ...historical.map((r) => [
        r.period,
        r.name,
        r.province,
        indicator,
        r.value ?? r.category,
        r.unit,
        r.count,
        r.dates.join("; "),
        r.protocols.join("; "),
        r.source,
      ]),
    ]);
  const sourceReferences =
    source === "observations"
      ? [
          ...new Set(
            observations.map(
              (r) =>
                [r.source_name, r.dataset_name, r.dataset_version]
                  .filter(Boolean)
                  .join(" / ") ||
                "Source metadata not linked to this observation",
            ),
          ),
        ]
      : [...new Set(summaries.flatMap((r) => r.sources || []))];
  if (status === "loading")
    return (
      <div
        role="status"
        className={`${panel} py-16 text-center text-slate-600`}
      >
        Loading soil observations, sampling metadata and district records...
      </div>
    );
  if (status === "error")
    return (
      <div role="alert" className={`${panel} space-y-4`}>
        <h1 className="text-xl font-bold">Soil data could not be loaded</h1>
        <p className="text-sm text-slate-600">
          The soil service is unavailable. Please try again.
        </p>
        <button className={button} onClick={() => setRetry((r) => r + 1)}>
          <RefreshCw size={16} /> Retry soil data
        </button>
      </div>
    );
  if (!seasons.length)
    return (
      <div className={panel}>
        <h1 className="text-xl font-bold">
          No soil reporting periods available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Published observations or district records with assigned periods are
          needed to populate this explorer.
        </p>
      </div>
    );
  return (
    <div className="space-y-8 text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Soil &amp; Fertility | Public Explorer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Explore Rwanda's soil evidence
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Explore recorded soil properties, sampling coverage, and reported
            management practices without assuming every field shares a
            district's soil condition.
          </p>
        </div>
        <span className="max-w-full rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-950">
          {scopeLabel}
        </span>
      </header>
      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      >
        <Info size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">
            {source === "observations"
              ? "Recorded observations are not district-wide soil estimates."
              : "District summaries do not establish repeated laboratory measurements."}
          </p>
          <p className="mt-1">
            {source === "observations"
              ? "Counts refer to property records, not necessarily distinct sample sites. Values are shown with their recorded methods, depths, units and dates. A small number of observations does not establish the condition of all soils in a district."
              : "These stored summaries have no linked sample counts, sampling methods or depths. Their classifications are shown as stored. Historical summary rows alone cannot establish seasonal soil change."}
          </p>
        </div>
      </div>
      <section aria-labelledby="soil-overview">
        <h2 id="soil-overview" className="mb-2 text-lg font-bold">
          {location === "Rwanda"
            ? "National soil and fertility overview"
            : `${location} soil and fertility overview`}
        </h2>
        <p className="mb-4 text-xs text-slate-500">{scopeLabel}</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [
              "Documented soil sampling area",
              null,
              "ha | represented sampling footprint not recorded",
            ],
            [
              "Districts with selected soil data",
              hasValue.length,
              "districts with a stored value, not district-wide coverage",
            ],
            [
              "Soil observation rows",
              source === "observations" ? observations.length : null,
              source === "observations"
                ? "property records in this selection"
                : "sample counts are not linked to district summaries",
            ],
            [
              "Selected indicators with data",
              hasValue.length ? 1 : 0,
              "one property is explored at a time; units are not combined",
            ],
          ].map(([label, value, caption]) => (
            <div key={String(label)} className={panel}>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-3 break-words text-2xl font-bold text-emerald-950">
                {format(value as number | null, 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{caption}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {catalog.length} properties are available in this source. Sampling
          hectares are not inferred from district cultivated area. Counts and
          values follow the selected property, geography and reporting period.
        </p>
      </section>
      <section className={panel} aria-labelledby="soil-filters">
        <h2
          id="soil-filters"
          className="mb-4 flex items-center gap-2 text-lg font-bold"
        >
          <Filter size={18} className="text-emerald-700" /> Soil and fertility
          filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-xs font-semibold">
            Evidence source
            <select
              aria-label="Soil evidence source"
              className={control}
              value={source}
              onChange={(e) => changeSource(e.target.value as SoilSource)}
            >
              <option value="observations">Recorded soil observations</option>
              <option value="summaries">Stored district summaries (modelled)</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Agricultural year
            <select
              aria-label="Soil agricultural year"
              className={control}
              value={season.slice(0, 4)}
              onChange={(e) => {
                const code =
                  seasons.find(
                    (s) => s === e.target.value + season.slice(-1),
                  ) || seasons.find((s) => s.startsWith(e.target.value));
                if (code) updateSeason(code);
              }}
            >
              {[...new Set(seasons.map((s) => s.slice(0, 4)))].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Reporting season
            <select
              aria-label="Soil season"
              className={control}
              value={season}
              onChange={(e) => updateSeason(e.target.value)}
            >
              {seasons
                .filter((s) => s.startsWith(season.slice(0, 4)))
                .map((s) => (
                  <option key={s} value={s}>
                    Season {s.slice(-1)} ({s})
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Comparison period
            <select
              aria-label="Soil comparison period"
              className={control}
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            >
              <option value="">No comparison</option>
              {seasons
                .filter((s) => s !== season)
                .map((s) => (
                  <option key={s}>{s}</option>
                ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Province
            <select
              aria-label="Soil province"
              className={control}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                updateDistrict("ALL");
              }}
            >
              <option value="ALL">All provinces</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            District
            <select
              aria-label="Soil district"
              className={control}
              value={district}
              onChange={(e) => updateDistrict(e.target.value)}
            >
              <option value="ALL">All districts in scope</option>
              {allowedDistricts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Soil indicator
            <select
              aria-label="Soil indicator"
              className={control}
              value={indicator}
              onChange={(e) => {
                setIndicator(e.target.value);
                setCategory("ALL");
                setProtocol("ALL");
              }}
            >
              {catalog.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Recorded classification
            <select
              aria-label="Soil recorded classification"
              className={control}
              value={category}
              disabled={!categoryOptions.length}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">
                {categoryOptions.length
                  ? "All stored categories"
                  : "No category recorded for this series"}
              </option>
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Sampling protocol
            <select
              aria-label="Soil sampling protocol"
              className={control}
              value={protocol}
              disabled={source !== "observations" || !protocolOptions.length}
              onChange={(e) => setProtocol(e.target.value)}
            >
              <option value="ALL">
                All recorded protocols (compatibility checked)
              </option>
              {protocolOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Soil organic carbon is not converted into organic matter. Nutrient
          concentrations, stored ratings, reported practices and modelled
          indices remain distinct. Historical sections vary the period while
          retaining these filters.
        </p>
        <button
          className={`${button} mt-4`}
          onClick={() => {
            setProvince("ALL");
            updateDistrict("ALL");
            setCategory("ALL");
            setProtocol("ALL");
            setQuery("");
          }}
        >
          Clear geographic and classification filters
        </button>
      </section>
      {!hasValue.length && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          {source === "observations" && observations.length > 0
            ? "Raw observations are available, but their methods, depths or units do not support a comparable grouped value. Inspect the observation records below."
            : "No compatible soil values match this source, property and period. Missing values do not mean zero nutrients or an assumed soil pH. Try another period or source."}
        </div>
      )}
      <section className={panel} aria-labelledby="soil-district-performance">
        <h2
          id="soil-district-performance"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <FlaskConical size={20} className="text-emerald-700" /> Soil fertility
          performance by district
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {selected?.name} | {season} | {sourceLabel}.{" "}
          {district === "ALL"
            ? "Select a district for its supporting records."
            : `Showing records associated with ${district}.`}
        </p>
        <ResponsiveTable
          aria-label="District soil values and supporting observations"
          className="mt-4 text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                metricLabel,
                selected?.kind === "category" ? "Category" : "Unit",
                "Observation rows",
                "Recorded dates",
                "Evidence",
              ].map((h, i) => (
                <th key={String(h) + i} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-slate-100">
                <th scope="row" className="p-3">
                  <button
                    className="text-left font-semibold text-emerald-800 underline"
                    onClick={() => updateDistrict(r.name)}
                  >
                    {r.name}
                  </button>
                </th>
                <td className="p-3">
                  {selected?.kind === "category"
                    ? text(r.category)
                    : format(r.value)}
                </td>
                <td className="p-3">
                  {selected?.kind === "category"
                    ? "stored classification"
                    : text(r.unit)}
                </td>
                <td className="p-3">
                  {r.count === null ? "Not linked" : r.count}
                </td>
                <td className="p-3">
                  {r.dates.length ? r.dates.join(", ") : "Not recorded"}
                </td>
                <td className="p-3 text-xs">{r.source.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
        <details
          className="mt-4"
          open={source === "observations" && (district !== "ALL" || !ordered)}
        >
          <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
            View individual observations and sampling metadata (
            {source === "observations" ? observations.length : 0})
          </summary>
          {source === "observations" ? (
            <div className="mt-3">
              <ResponsiveTable
                aria-label="Individual soil observations and methods"
                className="text-left text-sm"
              >
                <thead className="bg-slate-50 text-xs">
                  <tr>
                    {[
                      "District",
                      "Value / category",
                      "Unit",
                      "Observation date",
                      "Depth (cm)",
                      "Method",
                      "Geographic resolution",
                      "Source linkage",
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {observations.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <th scope="row" className="p-3">
                        {r.district}
                      </th>
                      <td className="p-3">
                        {r.value === null ? text(r.category) : format(r.value)}
                      </td>
                      <td className="p-3">{text(r.unit)}</td>
                      <td className="p-3">{text(r.observed_at)}</td>
                      <td className="p-3">{format(r.depth)}</td>
                      <td className="p-3">{text(r.method)}</td>
                      <td className="p-3">{r.geographic_resolution}</td>
                      <td className="p-3">
                        {r.source_name || r.dataset_name || "Not linked"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              District summaries are not linked to individual sample records.
              Choose the observation source to inspect its available records.
            </p>
          )}
        </details>
        <p className="mt-3 text-xs text-slate-500">
          Observation medians describe comparable records in this selection.
          They do not estimate all soils in a district; each supporting count is
          displayed.
        </p>
      </section>
      <section className={panel} aria-labelledby="soil-rankings">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="soil-rankings" className="text-lg font-bold">
              {location === "Rwanda"
                ? "National soil indicator comparisons"
                : `${location} soil indicator comparisons`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Higher recorded values are not automatically better soil. Each
              property keeps its own unit and interpretation.
            </p>
          </div>
          <button
            className={button}
            disabled={!results.length}
            onClick={exportComparisons}
          >
            <Download size={16} /> Export soil district comparisons
          </button>
        </div>
        <div className="my-4 flex flex-wrap items-end gap-3">
          <label className="flex-1 text-xs font-semibold">
            Search districts
            <input
              aria-label="Search soil districts"
              type="search"
              className={`${control} mt-1`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a district"
            />
          </label>
          <button className={button} onClick={() => setAscending((v) => !v)}>
            <ArrowUpDown size={15} />
            {ascending ? "Ascending value" : "Descending value"}
          </button>
        </div>
        {ordered ? (
          <>
            <p className="mb-3 text-xs text-slate-500">
              Descriptive comparison of observations with the same method, depth
              and unit. This is not a district-wide fertility score. Up to 10
              stored medians are shown.
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.filter((r) => r.value !== null).slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 5, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    fontSize={11}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `${format(Number(v))} ${unit}`,
                      "Recorded observation median",
                    ]}
                  />
                  <Bar dataKey="value" fill="#047857" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : selected?.kind === "category" ? (
          <>
            <p className="mb-3 text-xs text-slate-500">
              Distribution counts district summary records, not hectares, farms
              or confirmed nutrient deficiency incidence.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip formatter={(v) => [Number(v), "Stored records"]} />
                  <Bar dataKey="count" fill="#475569" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Comparable rankings are unavailable: sampling protocols are mixed,
            undocumented, or not linked to district summaries. Raw stored values
            remain available in the district table.
          </p>
        )}
        <ResponsiveTable
          aria-label="Sortable soil indicator comparison"
          className="mt-4 text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                selected?.name || "Indicator",
                "Unit",
                "Observation rows",
                "Ordering / interpretation",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.name} className="border-b border-slate-100">
                <th scope="row" className="p-3">
                  {r.name}
                </th>
                <td className="p-3">
                  {selected?.kind === "category"
                    ? text(r.category)
                    : format(r.value)}
                </td>
                <td className="p-3">{text(r.unit)}</td>
                <td className="p-3">
                  {r.count === null ? "Not linked" : r.count}
                </td>
                <td className="p-3 text-xs">
                  {ordered
                    ? "Sample median only; not a district quality rank"
                    : selected?.kind === "category"
                      ? "Stored category; no numeric quality order"
                      : "Raw summary value; sampling comparability unavailable"}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </section>

      <section className={panel} aria-labelledby="soil-trends">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="soil-trends" className="text-lg font-bold">
              Soil fertility trends and comparability
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selected?.name} | {location}. Soil properties are not assumed to
              change every agricultural season.
            </p>
          </div>
          <button
            className={button}
            disabled={!historical.length}
            onClick={exportHistory}
          >
            Download soil indicator history
          </button>
        </div>
        <div className="my-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
          {selectedTrajectory?.matched ? (
            <>
              <strong>
                {selectedTrajectory.matched} matched site(s) support this
                comparison.
              </strong>
              <p className="mt-1">
                Median paired-site difference:{" "}
                {format(selectedTrajectory.change)}{" "}
                {unit === "%" ? "percentage points" : unit}. This is a
                difference between recorded samples, not a district-wide
                improvement or deterioration.
              </p>
            </>
          ) : (
            <>
              <strong>
                No supported soil-change estimate for this selection.
              </strong>
              <p className="mt-1">
                {district === "ALL"
                  ? "Select one district and two reporting periods to inspect matching sites. "
                  : ""}
                {selectedTrajectory?.reason ||
                  "Changes require matching locations, methods, depths, units and distinct observation dates."}{" "}
                {sourcePeriods.length === 1
                  ? "Only one observation reporting period is available in this source. "
                  : ""}
                District summary values are not treated as repeated soil tests.
              </p>
            </>
          )}
        </div>
        {trajectory.length > 0 && selectedTrajectory && (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(v, name) => [
                      `${format(Number(v))} ${unit}`,
                      String(name),
                    ]}
                  />
                  {selectedTrajectory.pairs.map((p, i) => (
                    <Line
                      key={p.site}
                      name={`Matched site ${i + 1}`}
                      dataKey={"site" + i}
                      stroke={palette[i % palette.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Each trace follows one matched recorded site with the same
              protocol. No unmatched district averages are connected.
            </p>
          </>
        )}
        <ResponsiveTable
          aria-label="Soil indicators across recorded periods"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "Period",
                "District",
                "Stored value / category",
                "Unit",
                "Observation rows",
                "Observation dates",
                "Evidence / comparison limit",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownHistorical.map((r) => (
              <tr
                key={r.period + r.name}
                className={`border-b border-slate-100 ${r.period === season ? "bg-emerald-50" : ""}`}
              >
                <th scope="row" className="p-3">
                  {r.period}
                </th>
                <td className="p-3">{r.name}</td>
                <td className="p-3">
                  {selected?.kind === "category"
                    ? text(r.category)
                    : format(r.value)}
                </td>
                <td className="p-3">{text(r.unit)}</td>
                <td className="p-3">
                  {r.count === null ? "Not linked" : r.count}
                </td>
                <td className="p-3">{r.dates.join(", ") || "Not recorded"}</td>
                <td className="p-3 text-xs">
                  {r.source === "RECORDED_OBSERVATIONS"
                    ? "Observation records; paired-site checks required"
                    : "District summary; seasonal change not established"}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
        {historical.length > 30 && !expandedHistory && (
          <button
            className={`${button} mt-4`}
            onClick={() => setExpandedHistory(true)}
          >
            Show all {historical.length} period and district records
          </button>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {shownHistorical.length} of {historical.length} historical rows shown.
          Selecting a comparison period does not by itself establish scientific
          comparability.
        </p>
      </section>
      <section className={panel} aria-labelledby="soil-map">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="soil-map"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <MapPin size={20} className="text-emerald-700" /> Interactive
              Rwanda soil and fertility map
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {scopeLabel}. The indicator filter selects the map layer. Select a
              district to update all results.
            </p>
          </div>
          <button className={button} onClick={() => updateDistrict("ALL")}>
            Show all soil districts in scope
          </button>
        </div>
        <div className="my-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {source === "observations"
            ? "Map shading shows medians of compatible observation records associated with a district. It does not extrapolate an individual sample to every farm or hectare."
            : "These district summaries originate in baseline-scaling and district-profile seed scripts. They are modelled context. Their sampling coverage and representativeness are not recorded."}{" "}
          {selected?.kind !== "category"
            ? "Darker shades mean a larger recorded number, not better fertility."
            : ""}{" "}
          Grey indicates no compatible value in this layer.
        </div>
        <div className={`grid gap-5 ${compare ? "lg:grid-cols-2" : ""}`}>
          {selected?.kind === "category" ? (
            <SoilCategoryMap
              categoryDomain={categoryDomain}
              title={`${season} | ${selected.name} | Stored categories`}
              data={rows.map((r) => ({ name: r.name, category: r.category }))}
              selectedDistrict={district}
              allowedDistricts={allowedDistricts}
              onSelectDistrict={updateDistrict}
            />
          ) : (
            <PublicChoropleth
              title={`${season} | ${selected?.name} | ${metricLabel}`}
              unit={unit}
              scaleMaximum={mapMaximum}
              data={mapData}
              selectedDistrict={district}
              allowedDistricts={allowedDistricts}
              onSelectDistrict={updateDistrict}
            />
          )}
          {compare &&
            (selected?.kind === "category" ? (
              <SoilCategoryMap
                categoryDomain={categoryDomain}
                title={`${compare} | ${selected.name} | Stored categories`}
                data={previousRows.map((r) => ({
                  name: r.name,
                  category: r.category,
                }))}
                selectedDistrict={district}
                allowedDistricts={allowedDistricts}
                onSelectDistrict={updateDistrict}
              />
            ) : (
              <PublicChoropleth
                title={`${compare} | ${selected?.name} | Separate period records`}
                unit={unit}
                scaleMaximum={mapMaximum}
                data={mapPrevious}
                selectedDistrict={district}
                allowedDistricts={allowedDistricts}
                onSelectDistrict={updateDistrict}
              />
            ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Comparison maps share a scale but do not establish temporal change.
          Sampling support must be checked in the observation and trend tables.
          A category colour is not a soil quality score.
        </p>
      </section>
      <section className={panel} aria-labelledby="soil-practices">
        <h2 id="soil-practices" className="text-lg font-bold">
          Soil conservation and fertility management practices
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Separate district practice records overlapping the selected
          soil-record geography and period. Reporting a practice does not
          measure its effectiveness.
        </p>
        <label className="my-4 block max-w-xl text-xs font-semibold">
          Reported practice
          <select
            aria-label="Soil management practice"
            className={`${control} mt-1`}
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
          >
            {Object.entries(PRACTICES)
              .filter(([key]) =>
                data.summaries.some(
                  (r) =>
                    r.practices[key] !== null && r.practices[key] !== undefined,
                ),
              )
              .map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name} ({p.unit})
                </option>
              ))}
          </select>
        </label>
        <ResponsiveTable
          aria-label="Reported soil management practices by district"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                `${practiceInfo.name} | ${season}`,
                compare ? `Stored value | ${compare}` : "Comparison period",
                "Unit",
                "Interpretation",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {practiceRows.map((r) => {
              const value = r.practices[practice] ?? null,
                areaMismatch =
                  practice.endsWith("_ha") &&
                  value !== null &&
                  r.cultivated !== null &&
                  value > r.cultivated;
              return (
                <tr key={r.id} className="border-b border-slate-100">
                  <th scope="row" className="p-3">
                    {r.district}
                  </th>
                  <td className="p-3">{format(value)}</td>
                  <td className="p-3">
                    {compare
                      ? format(
                          practiceBefore.get(r.district)?.practices[practice] ??
                            null,
                        )
                      : "Select a period"}
                  </td>
                  <td className="p-3">{practiceInfo.unit}</td>
                  <td className="p-3 text-xs">
                    {areaMismatch
                      ? "Reported practice area exceeds the cultivated-area figure. Coverage is not calculated."
                      : "Reported practice use; effectiveness not established"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ResponsiveTable>
        {!practiceRows.length && (
          <p className="mt-4 text-sm text-slate-500">
            No practice records overlap the selected soil series and period.
            Choose an available source or period to explore its records.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Farmer percentages are not percentages of land. Practice areas may
          overlap or use a different reporting basis, so they are not summed
          into a unique land footprint. Survey denominators and sampling frames
          are not documented here; changes are not interpreted as improvements.
          Compost, manure, rotation and terracing categories are not invented
          when separate records are absent.
        </p>
      </section>
      <section className={panel} aria-labelledby="soil-constraints">
        <h2 id="soil-constraints" className="text-lg font-bold">
          Soil constraints and management opportunities
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Use recorded classifications and sampling gaps to guide further
          assessment, not to diagnose all soil in a district.
        </p>
        {source === "summaries" && selected?.kind === "category" ? (
          <ResponsiveTable
            aria-label="Stored soil classifications and evidence"
            className="mt-4 text-left text-sm"
          >
            <thead className="bg-slate-50 text-xs">
              <tr>
                <th className="p-3">District</th>
                <th className="p-3">Stored classification</th>
                <th className="p-3">Supporting sample count</th>
                <th className="p-3">Evidence limit</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => r.category !== null)
                .map((r) => (
                  <tr key={r.name} className="border-b border-slate-100">
                    <th scope="row" className="p-3">
                      {r.name}
                    </th>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">Not linked</td>
                    <td className="p-3 text-xs">
                      District summary classification; not a field-specific
                      diagnosis
                    </td>
                  </tr>
                ))}
            </tbody>
          </ResponsiveTable>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {source === "observations"
              ? "No sample-specific deficiency classification is recorded for this numeric series. Values are not translated into undocumented deficiency thresholds."
              : "Select a stored classification to inspect the source categories. Numeric pH, carbon and modelled erosion values are not converted into undocumented district-wide diagnoses."}
          </p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 p-4">
            <h3 className="text-sm font-semibold">Additional sampling</h3>
            <p className="mt-2 text-xs text-slate-600">
              {missingDistricts.length} district(s) in this scope have no
              compatible selected value. Small or undocumented sample support
              calls for representative testing before district-wide conclusions.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 p-4">
            <h3 className="text-sm font-semibold">
              Confirm recorded constraints
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Review sample locations, depths, laboratory methods and dates. A
              modelled erosion index is not measured erosion loss, and a
              reported nutrient rating is not a concentration measurement.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 p-4">
            <h3 className="text-sm font-semibold">Management considerations</h3>
            <p className="mt-2 text-xs text-slate-600">
              Where acidity is confirmed, discuss liming with a qualified
              extension adviser. Plan nutrient and organic matter management
              using representative soil tests and crop context. This portal
              provides no fertilizer or lime dosage prescriptions.
            </p>
          </div>
        </div>
        {missingDistricts.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
              Districts without a compatible value in this selection
            </summary>
            <p className="mt-3 text-sm text-slate-500">
              {missingDistricts.join(", ")}
            </p>
          </details>
        )}
      </section>
      <section className={panel} aria-labelledby="soil-production">
        <h2 id="soil-production" className="text-lg font-bold">
          Soil and agricultural production comparison
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {selected?.name}, crop production and cultivated area in the same
          district and assigned reporting period.
        </p>
        <div className="my-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          This is an exploratory comparison of separate datasets. Crop output
          includes land and farms not sampled for soil. A shared district and
          season do not establish that the sampled fields produced these crops,
          or that soil properties caused an outcome.
        </div>
        <ResponsiveTable
          aria-label="Soil and crop production overlap by district"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                "Soil value / category",
                "Soil unit",
                "Soil observation rows",
                "Crop production (tonnes)",
                "Cultivated crop area (ha)",
                "Yield (tonnes/ha)",
                "Coverage relationship",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productionRows.map(({ soil: r, production: p }) => (
              <tr key={r.name} className="border-b border-slate-100">
                <th scope="row" className="p-3">
                  {r.name}
                </th>
                <td className="p-3">
                  {selected?.kind === "category"
                    ? text(r.category)
                    : format(r.value)}
                </td>
                <td className="p-3">{text(r.unit)}</td>
                <td className="p-3">
                  {r.count === null ? "Not linked" : r.count}
                </td>
                <td className="p-3">{format(p.production, 1)}</td>
                <td className="p-3">{format(p.area, 1)}</td>
                <td className="p-3">{format(p.yield)}</td>
                <td className="p-3 text-xs">
                  {p.records
                    ? "Same assigned district and period; field overlap unverified"
                    : "No matching crop records in this period"}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
        <p className="mt-3 text-xs text-slate-500">
          Yield uses production / harvested hectares from paired crop records.
          Crop-area sums can include intercropping and are not the hectares
          represented by soil sampling.
        </p>
      </section>
      <section
        className={`${panel} scroll-mt-32`}
        aria-labelledby="soil-downloads"
      >
        <h2 id="soil-downloads" className="scroll-mt-32 text-lg font-bold">
          Soil data and download center
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Export the selected observations or summaries, district comparisons,
          and recorded indicator history. Empty CSV cells preserve unavailable
          measurements and metadata.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          <button
            className={button}
            disabled={!rows.length}
            onClick={exportRows}
          >
            <Download size={16} /> Filtered soil CSV
          </button>
          <button
            className={button}
            disabled={!results.length}
            onClick={exportComparisons}
          >
            Soil district comparison CSV
          </button>
          <button
            className={button}
            disabled={!historical.length}
            onClick={exportHistory}
          >
            Soil indicator history CSV
          </button>
        </div>
        <div id="soil-sources" className="scroll-mt-32">
          <h3 className="mb-3 font-semibold">
            Sources, sampling coverage and methodology
          </h3>
          <dl className="grid gap-5 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Selected reporting scope</dt>
              <dd className="mt-1 text-slate-500">
                {scopeLabel}.{" "}
                {source === "observations"
                  ? `${observations.length} observation rows`
                  : `${summaries.length} district summary rows`}
                . Source periods available:{" "}
                {sourcePeriods.slice().sort().join(", ")}.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Observation support</dt>
              <dd className="mt-1 text-slate-500">
                The database holds {data.observations.length} observation rows
                across {new Set(data.observations.map((r) => r.indicator)).size}{" "}
                properties. Rows can describe different properties at the same
                site. No sampling footprint or district-wide representation
                weights are documented.
              </dd>
            </div>
            {Object.entries(data.methodology).map(([key, value]) => (
              <div key={key}>
                <dt className="font-semibold capitalize">{key}</dt>
                <dd className="mt-1 text-slate-500">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="font-semibold">Units and source categories</dt>
              <dd className="mt-1 text-slate-500">
                Observation units are used as recorded. Carbon is not equated
                with organic matter. Nutrient ratings are categories, not mg/kg
                or percentage concentrations. Cation exchange capacity with an
                undocumented measurement basis is not used for a quantitative
                comparison layer.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Public scope</dt>
              <dd className="mt-1 text-slate-500">
                No user accounts, private operator details, fertilizer
                prescriptions or exact sample coordinates are exposed by this
                explorer. References are stored database citations, not
                independent verification of their publications.
              </dd>
            </div>
          </dl>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
              View source references for this selection (
              {sourceReferences.length})
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-slate-500">
              {sourceReferences.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}

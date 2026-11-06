import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  Filter,
  MapPin,
  TrendingUp,
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
import { downloadPublicCsv } from "../publicDownloads";
import {
  irrigationNumber,
  inIrrigationGeography,
  irrigationObservations,
  summarizeIrrigation,
  irrigationDistricts,
  irrigationChange,
  coverageChange,
  irrigationMethods,
  seasonalSchemeCount,
} from "../irrigationModel";
import type {
  IrrigationPayload,
  IrrigationScope,
  IrrigationCategory,
  IrrigationMetric,
  IrrigationProductionRecord,
} from "../irrigationModel";
import { summarize as summarizeProduction } from "../productionModel";

const panel =
  "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm";
const control =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 disabled:cursor-not-allowed disabled:opacity-60";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-950 hover:bg-cyan-50 disabled:opacity-40";
const fmt = (n: number | null, digits = 1) =>
  n === null
    ? "Not available"
    : n.toLocaleString("en-GB", { maximumFractionDigits: digits });
const delta = (n: number | null, unit = "%") =>
  n === null ? "Not comparable" : `${n > 0 ? "+" : ""}${n.toFixed(2)}${unit}`;
const evidenceLabel = (modelled: number, records: number) =>
  modelled > 0
    ? modelled === records
      ? "Modelled estimates"
      : "Mixed evidence; includes estimates"
    : "Stored records; independent verification unavailable";
const emptyPayload: IrrigationPayload = {
  records: [],
  production: [],
  schemes: [],
  schemeSeasons: [],
  methodology: {},
};
function coordinate(value: unknown, limit: number) {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export default function IrrigationExplorer({
  initialDistrict = "ALL",
  onDistrictChange,
}: {
  initialDistrict?: string;
  onDistrictChange?: (district: string) => void;
}) {
  const [data, setData] = useState<IrrigationPayload>(emptyPayload);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  const [season, setSeason] = useState("");
  const [compare, setCompare] = useState("");
  const [province, setProvince] = useState("ALL");
  const [district, setDistrict] = useState(initialDistrict);
  const [crop, setCrop] = useState("ALL");
  const [category, setCategory] = useState<IrrigationCategory>("ALL");
  const [metric, setMetric] = useState<IrrigationMetric>("irrigated");
  const [sort, setSort] = useState<
    "name" | IrrigationMetric | "areaChange" | "coverageChange"
  >("irrigated");
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");
  const [registryQuery, setRegistryQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setData(emptyPayload);
    fetch(`${API_BASE_URL}/irrigation/public-explorer`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Irrigation request failed");
        return res.json();
      })
      .then((raw: IrrigationPayload) => {
        if (
          ![raw.records, raw.production, raw.schemes, raw.schemeSeasons].every(
            Array.isArray,
          )
        )
          throw new Error("Invalid irrigation response");
        const normalized: IrrigationPayload = {
          ...raw,
          records: raw.records.map((r) => ({
            ...r,
            year: Number(r.year),
            irrigated: irrigationNumber(r.irrigated),
            cultivated: irrigationNumber(r.cultivated),
            modern: irrigationNumber(r.modern),
            traditional: irrigationNumber(r.traditional),
            methods:
              typeof r.methods === "object" &&
              r.methods !== null &&
              !Array.isArray(r.methods)
                ? r.methods
                : null,
          })),
          production: raw.production.map((r) => ({
            ...r,
            year: Number(r.year),
            irrigated: irrigationNumber(r.irrigated),
            area: irrigationNumber(r.area),
            production: irrigationNumber(r.production),
            harvested: irrigationNumber(r.harvested),
          })),
          schemes: raw.schemes.map((r) => ({
            ...r,
            command_area: irrigationNumber(r.command_area),
            irrigable_area: irrigationNumber(r.irrigable_area),
            longitude: coordinate(r.longitude, 180),
            latitude: coordinate(r.latitude, 90),
          })),
        };
        if (controller.signal.aborted) return;
        const available = [
          ...new Set([
            ...normalized.records.map((r) => r.season_code),
            ...normalized.production
              .filter((r) => r.irrigated !== null)
              .map((r) => r.season_code),
          ]),
        ]
          .sort()
          .reverse();
        const latest = available[0] || "";
        setData(normalized);
        setSeason(latest);
        const equivalent = `${Number(latest.slice(0, 4)) - 1}${latest.slice(-1)}`;
        setCompare(available.includes(equivalent) ? equivalent : "");
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [retry]);
  const seasons = useMemo(
    () =>
      [
        ...new Set([
          ...data.records.map((r) => r.season_code),
          ...data.production
            .filter((r) => r.irrigated !== null)
            .map((r) => r.season_code),
        ]),
      ]
        .sort()
        .reverse(),
    [data],
  );
  const geographicRows = [
    ...data.records,
    ...data.production.filter((r) => r.irrigated !== null),
  ];
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
  const crops = [
    ...new Set(
      data.production.filter((r) => r.irrigated !== null).map((r) => r.crop),
    ),
  ].sort();
  const scope: IrrigationScope = { province, district, crop, category };
  const current = irrigationObservations(data, scope, season),
    previous = compare ? irrigationObservations(data, scope, compare) : [];
  const summary = summarizeIrrigation(current, category),
    baseline = summarizeIrrigation(previous, category);
  const currentDistricts = irrigationDistricts(current, category),
    previousDistricts = irrigationDistricts(previous, category);
  const before = new Map(previousDistricts.map((r) => [r.name, r]));
  const rows = currentDistricts.map((r) => ({
    ...r,
    areaChange: irrigationChange(
      r.irrigated,
      before.get(r.name)?.irrigated ?? null,
    ),
    coverageChange: coverageChange(
      r.coverage,
      before.get(r.name)?.coverage ?? null,
    ),
  }));
  const rankingRows = rows
    .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === "name")
        return a.name.localeCompare(b.name) * (ascending ? 1 : -1);
      const av = a[sort],
        bv = b[sort];
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      return (av - bv) * (ascending ? 1 : -1);
    });
  const ranked = rows
    .filter((r) => r[metric] !== null)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0));
  const trends = seasons
    .slice()
    .sort()
    .map((name) => ({
      name,
      ...summarizeIrrigation(
        irrigationObservations(data, scope, name),
        category,
      ),
    }));
  const methods = irrigationMethods(current);
  const registrySupported = crop === "ALL" && category === "ALL";
  const inventory = registrySupported
    ? data.schemes.filter((r) => inIrrigationGeography(r, scope))
    : [];
  const visibleInventory = inventory.filter((r) =>
    [r.name, r.district, r.method || "", r.type || ""]
      .join(" ")
      .toLowerCase()
      .includes(registryQuery.trim().toLowerCase()),
  );
  const selectedSchemeIds = new Set(
    data.schemeSeasons.filter((r) => r.season_code === season).map((r) => r.id),
  );
  const location =
    district !== "ALL"
      ? `${district} District`
      : province !== "ALL"
        ? province
        : "Rwanda";
  const categoryLabel =
    category === "ALL"
      ? "All irrigation categories"
      : category === "modern"
        ? "Modern irrigation"
        : "Traditional irrigation";
  const scopeLabel = `${location} · ${season || "No period"} · ${crop === "ALL" ? "All crops" : crop} · ${categoryLabel}`;
  const indicator =
    metric === "irrigated" ? "Irrigated area" : "Irrigation coverage";
  const unit = metric === "irrigated" ? "ha" : "%";
  const evidence = evidenceLabel(summary.modelled, summary.records);
  const positiveDistricts = new Set(
    current
      .filter((r) => r.irrigated !== null && r.irrigated > 0)
      .map((r) => r.district),
  );
  const contextProduction = (code: string) =>
    data.production.filter(
      (r) =>
        r.season_code === code &&
        inIrrigationGeography(r, scope) &&
        (crop === "ALL" || r.crop === crop) &&
        positiveDistricts.has(r.district),
    );
  const currentProduction = contextProduction(season),
    previousProduction = compare ? contextProduction(compare) : [];
  const cropGroups = new Map<string, IrrigationProductionRecord[]>();
  currentProduction.forEach((r) => {
    const group = cropGroups.get(r.crop);
    if (group) group.push(r);
    else cropGroups.set(r.crop, [r]);
  });
  const productionSummary = (records: IrrigationProductionRecord[]) =>
    summarizeProduction(
      records.map((r) => ({
        season_code: r.season_code,
        year: r.year,
        crop: r.crop,
        district: r.district,
        province: r.province,
        production: r.production,
        area: r.area,
        harvested: r.harvested,
      })),
    );
  const productionRows = [...cropGroups]
    .map(([name, records]) => ({
      name,
      ...productionSummary(records),
      previous: productionSummary(
        previousProduction.filter((r) => r.crop === name),
      ),
    }))
    .sort((a, b) => (b.production ?? -1) - (a.production ?? -1));
  const productionByDistrict = new Map(
    [...positiveDistricts].map((name) => [
      name,
      productionSummary(currentProduction.filter((r) => r.district === name)),
    ]),
  );
  const mapValues = [...currentDistricts, ...(compare ? previousDistricts : [])]
    .map((r) => r[metric])
    .filter((value): value is number => value !== null);
  const mapMaximum = mapValues.length ? Math.max(...mapValues) : null;
  const references = [...new Set(current.map((r) => r.source))];
  const updateDistrict = (name: string) => {
    setDistrict(name);
    onDistrictChange?.(name);
  };
  const updateSeason = (code: string) => {
    setSeason(code);
    if (code === compare) setCompare("");
  };
  const metadata = [province, district, crop, category];
  const csvHeaders = [
    "Season",
    "Province filter",
    "District filter",
    "Crop filter",
    "Irrigation category",
    "District",
    "Cultivated area (ha)",
    "Irrigated area (ha)",
    "Coverage (%)",
    "Non-irrigated area (ha)",
    "Evidence",
    "Source",
  ];
  const exportCurrent = () =>
    downloadPublicCsv(`agrilens-irrigation-${season}-${district}.csv`, [
      csvHeaders,
      ...current.map((r) => {
        const s = summarizeIrrigation([r], category);
        return [
          season,
          ...metadata,
          r.district,
          r.cultivated,
          r.irrigated,
          s.coverage,
          s.nonIrrigated,
          r.evidence,
          r.source,
        ];
      }),
    ]);
  const exportDistricts = () =>
    downloadPublicCsv(
      `agrilens-irrigation-district-comparison-${season}-${compare || "none"}.csv`,
      [
        [
          "Season",
          ...csvHeaders.slice(1, 5),
          "District",
          "Irrigated area (ha)",
          "Coverage (%)",
          "Comparison season",
          "Previous irrigated area (ha)",
          "Previous coverage (%)",
          "Area change (%)",
          "Coverage change (percentage points)",
          "Evidence",
        ],
        ...rankingRows.map((r) => [
          season,
          ...metadata,
          r.name,
          r.irrigated,
          r.coverage,
          compare,
          before.get(r.name)?.irrigated ?? null,
          before.get(r.name)?.coverage ?? null,
          r.areaChange,
          r.coverageChange,
          evidenceLabel(r.modelled, r.records),
        ]),
      ],
    );
  const exportSeasons = () =>
    downloadPublicCsv(`agrilens-irrigation-seasonal-${season}.csv`, [
      [
        "Season",
        "Province filter",
        "District filter",
        "Crop filter",
        "Irrigation category",
        "Irrigated area (ha)",
        "Coverage (%)",
        "Cultivated area (ha)",
        "Districts with measurements",
        "Comparable districts",
        "Comparison season",
        "Area change (%)",
        "Coverage change (percentage points)",
        "Evidence",
      ],
      ...trends.map((r) => [
        r.name,
        ...metadata,
        r.irrigated,
        r.coverage,
        r.cultivated,
        r.districts,
        r.pairedDistricts,
        compare,
        compare ? irrigationChange(r.irrigated, baseline.irrigated) : null,
        compare ? coverageChange(r.coverage, baseline.coverage) : null,
        evidenceLabel(r.modelled, r.records),
      ]),
    ]);
  if (status === "loading")
    return (
      <div
        role="status"
        className={`${panel} py-16 text-center text-slate-600`}
      >
        Loading irrigation records and reporting periods…
      </div>
    );
  if (status === "error")
    return (
      <div role="alert" className={`${panel} space-y-4`}>
        <h1 className="text-xl font-bold">
          Irrigation data could not be loaded
        </h1>
        <p className="text-sm text-slate-600">
          The irrigation service is unavailable. Please try again.
        </p>
        <button className={button} onClick={() => setRetry((r) => r + 1)}>
          <RefreshCw size={16} /> Retry irrigation data
        </button>
      </div>
    );
  if (!seasons.length)
    return (
      <div className={panel}>
        <h1 className="text-xl font-bold">
          No seasonal irrigation records available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Indicators will appear when irrigation measurements or estimates are
          published with reporting periods.
        </p>
      </div>
    );

  return (
    <div className="space-y-8 text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Irrigation · Public Explorer
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Explore Rwanda’s irrigation
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Compare district irrigation, follow seasonal changes, and explore
            the geography of water in agriculture.
          </p>
        </div>
        <span className="max-w-full rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-950">
          {scopeLabel}
        </span>
      </header>
      <div
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        role="note"
      >
        <Info size={20} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">
            {summary.modelled > 0
              ? "These seasonal values include modelled estimates."
              : "Understand the evidence behind these figures."}
          </p>
          <p className="mt-1">
            {summary.modelled > 0
              ? "Source notes label these records as model-generated. They are not confirmed field measurements. "
              : ""}
            Scheme registry entries and crop records are separate datasets. Low
            coverage alone does not establish irrigation feasibility; water
            availability, terrain, cost, and environmental conditions require
            assessment.
          </p>
        </div>
      </div>
      <section aria-labelledby="irrigation-overview">
        <h2 id="irrigation-overview" className="mb-2 text-lg font-bold">
          {location === "Rwanda"
            ? "National irrigation overview"
            : `${location} irrigation overview`}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          {scopeLabel} — {evidence}
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [
              "Total irrigated area",
              summary.irrigated,
              "hectares · " +
                (category === "ALL"
                  ? "all categories"
                  : categoryLabel.toLowerCase()),
            ],
            [
              "Irrigation coverage",
              summary.coverage,
              "% of comparable cultivated area",
            ],
            [
              summary.modelled > 0
                ? "Districts with estimates"
                : "Districts with irrigation records",
              summary.districts,
              "available area values, including zeroes",
            ],
            [
              "Season-linked schemes",
              seasonalSchemeCount(data, scope, season),
              "requires explicit scheme-to-season records",
            ],
          ].map(([label, value, caption]) => (
            <div key={String(label)} className={panel}>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-3 break-words text-2xl font-bold text-cyan-950">
                {fmt(
                  value as number | null,
                  label === "Irrigation coverage" ? 2 : 1,
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">{caption}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Coverage uses {summary.pairedDistricts} compatible district record
          {summary.pairedDistricts === 1 ? "" : "s"}. Missing data is not zero.
          Scheme inventory totals are shown separately because registry entries
          may not have seasonal links.
        </p>
        {summary.partial && (
          <p className="mt-2 text-sm text-amber-800">
            Some measurements are missing; totals and coverage use available
            records and compatible pairs.
          </p>
        )}
        {summary.incompatible > 0 && (
          <p className="mt-2 text-sm text-amber-800">
            {summary.incompatible} record(s) have irrigated area greater than
            cultivated area. Coverage and non-irrigated area exclude these
            incompatible pairs.
          </p>
        )}
      </section>
      <section className={panel} aria-labelledby="irrigation-filters">
        <h2
          id="irrigation-filters"
          className="mb-4 flex items-center gap-2 text-lg font-bold"
        >
          <Filter size={18} className="text-cyan-700" /> Irrigation filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-xs font-semibold">
            Agricultural year
            <select
              aria-label="Irrigation agricultural year"
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
            Season
            <select
              aria-label="Irrigation season"
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
            Comparison season
            <select
              aria-label="Irrigation comparison season"
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
              aria-label="Irrigation province"
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
              aria-label="Irrigation district"
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
            Irrigation category
            <select
              aria-label="Irrigation category"
              className={control}
              value={category}
              disabled={crop !== "ALL"}
              onChange={(e) =>
                setCategory(e.target.value as IrrigationCategory)
              }
            >
              <option value="ALL">All categories</option>
              {data.records.some((r) => r.modern !== null) && (
                <option value="modern">Modern irrigation</option>
              )}
              {data.records.some((r) => r.traditional !== null) && (
                <option value="traditional">Traditional irrigation</option>
              )}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Crop, where irrigated area is recorded
            <select
              aria-label="Irrigation crop"
              className={control}
              value={crop}
              disabled={!crops.length}
              onChange={(e) => {
                setCrop(e.target.value);
                setCategory("ALL");
              }}
            >
              <option value="ALL">
                All crops (district irrigation series)
              </option>
              {crops.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          A selected crop uses that crop’s recorded irrigated-area measurements,
          rather than assigning district estimates to a crop. Category
          breakdowns and scheme-to-crop links are unavailable for crop series.
          Missing crop measurements remain unavailable.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            All results use this scope; historical trends vary the reporting
            period.
          </span>
          <button
            className={button}
            onClick={() => {
              setProvince("ALL");
              updateDistrict("ALL");
              setCrop("ALL");
              setCategory("ALL");
              setQuery("");
              setRegistryQuery("");
            }}
          >
            Clear geographic, category and crop filters
          </button>
        </div>
      </section>
      {!current.some((r) => r.irrigated !== null) && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          No irrigated-area measurements match {scopeLabel}. Try another period
          or crop. Missing measurements do not mean zero irrigation.
        </div>
      )}
      <section
        className={panel}
        aria-labelledby="irrigation-district-performance"
      >
        <h2
          id="irrigation-district-performance"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <Droplets size={20} className="text-cyan-700" /> Irrigation
          performance by district
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {district === "ALL"
            ? `Showing ${location} totals. Select a district to view its statistics.`
            : `District statistics for ${district}.`}{" "}
          {season} — {categoryLabel} — {crop === "ALL" ? "all crops" : crop}
        </p>
        <div className="mt-5 grid items-start gap-6 lg:grid-cols-2">
          <ResponsiveTable
            aria-label={`Irrigation performance for ${scopeLabel}`}
            className="text-left text-sm"
          >
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Indicator</th>
                <th className="p-3">Selected period</th>
                <th className="p-3">{compare || "Comparison not selected"}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Cultivated area", "cultivated", "ha"],
                ["Irrigated area", "irrigated", "ha"],
                ["Irrigated share of cultivated area", "coverage", "%"],
                ["Non-irrigated area", "nonIrrigated", "ha"],
              ].map(([label, key, u]) => (
                <tr key={key} className="border-b border-slate-100">
                  <th scope="row" className="p-3 font-semibold">
                    {label}
                  </th>
                  <td className="p-3 tabular-nums">
                    {fmt(summary[key as "irrigated"], 2)}{" "}
                    {summary[key as "irrigated"] === null ? "" : u}
                  </td>
                  <td className="p-3 tabular-nums">
                    {compare
                      ? `${fmt(baseline[key as "irrigated"], 2)} ${baseline[key as "irrigated"] === null ? "" : u}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Irrigated and non-irrigated areas (ha)
            </h3>
            {summary.irrigated !== null && summary.nonIrrigated !== null ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: season,
                        irrigated: summary.pairedIrrigated,
                        nonIrrigated: summary.nonIrrigated,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => Number(v).toLocaleString()}
                    />
                    <Tooltip
                      formatter={(v, name) => [
                        `${fmt(Number(v))} ha`,
                        name === "irrigated" ? "Irrigated" : "Non-irrigated",
                      ]}
                    />
                    <Bar dataKey="irrigated" stackId="area" fill="#0891b2" />
                    <Bar dataKey="nonIrrigated" stackId="area" fill="#cbd5e1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Area comparison is unavailable for this scope. Non-irrigated
                area requires compatible total cultivated and total irrigated
                measurements; category-specific area cannot identify all
                non-irrigated land.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              {evidence}. Non-irrigated area is calculated only for compatible
              pairs. It is not an irrigation suitability assessment.
            </p>
          </div>
        </div>
      </section>
      <section className={panel} aria-labelledby="irrigation-rankings">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="irrigation-rankings" className="text-lg font-bold">
              {location === "Rwanda"
                ? "National district irrigation rankings"
                : `${location} irrigation rankings`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Rank districts by irrigated area, coverage, or seasonal change.
              Choose ascending order for the lowest reported values.
            </p>
          </div>
          <button
            className={button}
            disabled={!rankingRows.length}
            onClick={exportDistricts}
          >
            <Download size={16} /> Export district comparisons
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold">
            Ranking indicator
            <select
              aria-label="Irrigation ranking indicator"
              className={`${control} mt-1`}
              value={metric}
              onChange={(e) => {
                setMetric(e.target.value as IrrigationMetric);
                setSort(e.target.value as IrrigationMetric);
              }}
            >
              <option value="irrigated">Irrigated area (ha)</option>
              <option value="coverage">Coverage (%)</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Search districts
            <input
              aria-label="Search irrigation districts"
              type="search"
              className={`${control} mt-1`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a district…"
            />
          </label>
          <label className="text-xs font-semibold">
            Table sort
            <select
              aria-label="Irrigation table sort"
              className={`${control} mt-1`}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="irrigated">Irrigated area</option>
              <option value="coverage">Coverage</option>
              <option value="name">District name</option>
              <option value="areaChange">Area change (%)</option>
              <option value="coverageChange">Coverage change (pp)</option>
            </select>
          </label>
        </div>
        <div className="my-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {scopeLabel} — {evidence}
          </p>
          <button className={button} onClick={() => setAscending((v) => !v)}>
            <ArrowUpDown size={15} />
            {ascending ? "Ascending" : "Descending"}
          </button>
        </div>
        <div className="mb-4 h-80">
          {ranked.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(ascending ? ranked.slice().reverse() : ranked).slice(
                  0,
                  10,
                )}
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
                  formatter={(v) => [`${fmt(Number(v), 2)} ${unit}`, indicator]}
                />
                <Bar dataKey={metric} fill="#0891b2" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="pt-12 text-center text-sm text-slate-500">
              No available values to rank.
            </p>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Chart shows up to 10 districts. Recorded zeroes are included; missing
          measurements are unranked. Table search affects this table and its
          export.
        </p>
        <ResponsiveTable
          aria-label="District irrigation rankings and seasonal changes"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                "Cultivated area (ha)",
                "Irrigated area (ha)",
                "Coverage (%)",
                compare ? `Area change vs ${compare} (%)` : "Area change (%)",
                compare
                  ? `Coverage change vs ${compare} (pp)`
                  : "Coverage change (pp)",
                "Evidence",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankingRows.map((r) => (
              <tr key={r.name} className="border-b border-slate-100">
                <th scope="row" className="p-3">
                  <button
                    className="text-left font-semibold text-cyan-800 underline"
                    onClick={() => updateDistrict(r.name)}
                  >
                    {r.name}
                  </button>
                </th>
                <td className="p-3">{fmt(r.cultivated)}</td>
                <td className="p-3">{fmt(r.irrigated)}</td>
                <td className="p-3">{fmt(r.coverage, 2)}</td>
                <td className="p-3">
                  {compare ? delta(r.areaChange) : "Select a comparison"}
                </td>
                <td className="p-3">
                  {compare
                    ? delta(r.coverageChange, " pp")
                    : "Select a comparison"}
                </td>
                <td className="p-3 text-xs">
                  {evidenceLabel(r.modelled, r.records)}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
        {!rankingRows.length && (
          <p className="py-5 text-center text-sm text-slate-500">
            No districts match the search or selected scope.
          </p>
        )}
      </section>

      <section className={panel} aria-labelledby="irrigation-trends">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="irrigation-trends"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <TrendingUp size={20} className="text-cyan-700" /> Seasonal
              irrigation trends
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {location} — {crop === "ALL" ? "All crops" : crop} —{" "}
              {categoryLabel}. Available A, B, and C reporting periods across
              years.
            </p>
          </div>
          <button className={button} onClick={exportSeasons}>
            Download seasonal summary
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-cyan-50 p-4 text-sm text-cyan-950">
          {compare ? (
            <>
              <strong>
                {season} compared with {compare}
              </strong>
              <p className="mt-1">
                Irrigated area:{" "}
                {delta(irrigationChange(summary.irrigated, baseline.irrigated))}
                . Coverage:{" "}
                {delta(
                  coverageChange(summary.coverage, baseline.coverage),
                  " percentage points",
                )}{" "}
                ({delta(irrigationChange(summary.coverage, baseline.coverage))}{" "}
                relative change).
              </p>
            </>
          ) : (
            <p>Select a comparison season to calculate changes.</p>
          )}
          <p className="mt-2 text-xs">
            {compare && compare.slice(-1) !== season.slice(-1)
              ? "These are different agricultural seasons; interpret changes in their seasonal context. "
              : "Equivalent season letters across years provide a more consistent comparison. "}
            District coverage and source availability can vary. Percentage
            changes require a nonzero baseline.
          </p>
        </div>
        <label className="mt-4 block max-w-sm text-xs font-semibold">
          Trend and map indicator
          <select
            aria-label="Irrigation trend and map indicator"
            className={`${control} mt-1`}
            value={metric}
            onChange={(e) => setMetric(e.target.value as IrrigationMetric)}
          >
            <option value="irrigated">Irrigated area (ha)</option>
            <option value="coverage">Coverage (%)</option>
          </select>
        </label>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip
                formatter={(v) => [`${fmt(Number(v), 2)} ${unit}`, indicator]}
              />
              <Line
                type="linear"
                dataKey={metric}
                stroke="#0891b2"
                strokeWidth={3}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          {indicator} ({unit}). Gaps indicate missing or incompatible
          measurements; source evidence follows the selected series.
        </p>
        <ResponsiveTable
          aria-label="Seasonal irrigation comparison"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "Season",
                "Irrigated area (ha)",
                "Coverage (%)",
                "Districts with data",
                "Area change vs baseline (%)",
                "Coverage change vs baseline (pp)",
                "Evidence",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trends.map((r) => (
              <tr
                key={r.name}
                className={`border-b border-slate-100 ${r.name === season ? "bg-cyan-50 font-semibold" : ""}`}
              >
                <th scope="row" className="p-3">
                  {r.name}
                </th>
                <td className="p-3">{fmt(r.irrigated)}</td>
                <td className="p-3">{fmt(r.coverage, 2)}</td>
                <td className="p-3">{fmt(r.districts, 0)}</td>
                <td className="p-3">
                  {compare && r.name !== compare
                    ? delta(irrigationChange(r.irrigated, baseline.irrigated))
                    : "—"}
                </td>
                <td className="p-3">
                  {compare && r.name !== compare
                    ? delta(
                        coverageChange(r.coverage, baseline.coverage),
                        " pp",
                      )
                    : "—"}
                </td>
                <td className="p-3 text-xs">
                  {evidenceLabel(r.modelled, r.records)}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </section>
      <section className={panel} aria-labelledby="irrigation-map">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="irrigation-map"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <MapPin size={20} className="text-cyan-700" /> Interactive Rwanda
              irrigation map
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {scopeLabel}. Selecting a district updates all results. Comparison
              maps use the same geographic scope and indicator.
            </p>
          </div>
          <label className="text-xs font-semibold">
            Map layer
            <select
              aria-label="Irrigation map layer"
              className={`${control} mt-1`}
              value={metric}
              onChange={(e) => setMetric(e.target.value as IrrigationMetric)}
            >
              <option value="irrigated">Irrigated area (ha)</option>
              <option value="coverage">Coverage (%)</option>
            </select>
          </label>
        </div>
        <button
          className={`${button} my-4`}
          onClick={() => updateDistrict("ALL")}
        >
          Show all districts in scope
        </button>
        <div className={`grid gap-5 ${compare ? "lg:grid-cols-2" : ""}`}>
          <PublicChoropleth
            title={`${season} · ${indicator} · ${evidence}`}
            unit={unit}
            scaleMaximum={mapMaximum}
            data={currentDistricts.map((r) => ({
              name: r.name,
              value: r[metric],
            }))}
            selectedDistrict={district}
            allowedDistricts={allowedDistricts}
            onSelectDistrict={updateDistrict}
          />
          {compare && (
            <PublicChoropleth
              title={`${compare} · ${indicator} · ${evidenceLabel(baseline.modelled, baseline.records)}`}
              unit={unit}
              scaleMaximum={mapMaximum}
              data={previousDistricts.map((r) => ({
                name: r.name,
                value: r[metric],
              }))}
              selectedDistrict={district}
              allowedDistricts={allowedDistricts}
              onSelectDistrict={updateDistrict}
            />
          )}
        </div>
        {district !== "ALL" && (
          <div className="mt-4 rounded-xl bg-cyan-50 p-4" aria-live="polite">
            <h3 className="text-sm font-semibold text-cyan-950">
              {district} — {season}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <dt>Cultivated area</dt>
                <dd className="mt-1 font-semibold">
                  {fmt(summary.cultivated)} ha
                </dd>
              </div>
              <div>
                <dt>Irrigated area</dt>
                <dd className="mt-1 font-semibold">
                  {fmt(summary.irrigated)} ha
                </dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd className="mt-1 font-semibold">
                  {fmt(summary.coverage, 2)}%
                </dd>
              </div>
              <div>
                <dt>Non-irrigated area</dt>
                <dd className="mt-1 font-semibold">
                  {fmt(summary.nonIrrigated)}{" "}
                  {summary.nonIrrigated === null ? "" : "ha"}
                </dd>
              </div>
            </dl>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          District boundaries use the geometry bundled with AgriLens. Comparison
          maps share a colour scale; compare exact values in the district table.
          Grey is not zero irrigation.
        </p>
      </section>
      <section className={panel} aria-labelledby="irrigation-methods">
        <h2 id="irrigation-methods" className="text-lg font-bold">
          Irrigation methods and systems
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Only categories present in the source records appear here. Percentage
          breakdowns, method hectares, and scheme inventory are separate
          measurements.
        </p>
        <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Stored method breakdowns · {season}
            </h3>
            {methods.methods.length ? (
              <>
                <ResponsiveTable
                  aria-label="Recorded irrigation method percentages"
                  className="text-left text-sm"
                >
                  <thead className="bg-slate-50 text-xs">
                    <tr>
                      <th className="p-3">Method</th>
                      <th className="p-3">Stored share range (%)</th>
                      <th className="p-3">Districts</th>
                      <th className="p-3">Method area (ha)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methods.methods.map((m) => (
                      <tr key={m.key} className="border-b border-slate-100">
                        <th scope="row" className="p-3 capitalize">
                          {m.name}
                        </th>
                        <td className="p-3">
                          {m.minimum === m.maximum
                            ? fmt(m.minimum, 2)
                            : `${fmt(m.minimum, 2)}–${fmt(m.maximum, 2)}`}
                        </td>
                        <td className="p-3">{m.districts}</td>
                        <td className="p-3">Not recorded</td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
                <p className="mt-3 text-xs text-slate-500">
                  These are stored district percentages,{" "}
                  {summary.modelled > 0 ? "within modelled records, " : ""}not
                  national method shares. Their denominator is undocumented, so
                  method hectares are not inferred. Change the district or
                  comparison season to inspect recorded distributions.
                </p>
                {methods.incomplete > 0 && (
                  <p className="mt-2 text-xs text-amber-800">
                    {methods.incomplete} district breakdown(s) do not sum to
                    100%. Values have not been normalised.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No compatible method breakdown is available for this crop,
                category, or season.
              </p>
            )}
            {compare &&
              (() => {
                const previousMethods = irrigationMethods(previous);
                return previousMethods.methods.length ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-cyan-800">
                      Method breakdowns for {compare}
                    </summary>
                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                      {previousMethods.methods.map((m) => (
                        <li key={m.key} className="capitalize">
                          {m.name}: {fmt(m.minimum, 2)}—{fmt(m.maximum, 2)}%
                          across {m.districts} district(s)
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Comparison-period method breakdowns are unavailable.
                  </p>
                );
              })()}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Recorded scheme registry
            </h3>
            <p className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-sm text-cyan-950">
              {registrySupported
                ? `${inventory.length} registry entries match the geographic scope. ${seasonalSchemeCount(data, scope, season) === null ? "None have a recorded link to the selected season. Their existence or operation in this season cannot be inferred." : `${seasonalSchemeCount(data, scope, season)} have explicit links to ${season}.`}`
                : "Scheme records cannot be attributed to this crop or irrigation category. Select All crops and All categories to inspect the geographic registry."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Command area and irrigable area are infrastructure attributes, not
              seasonal irrigated hectares. Locations and status are shown as
              stored; verification dates may be missing.
            </p>
          </div>
        </div>
        {registrySupported && (
          <>
            <label className="mt-5 block max-w-lg text-xs font-semibold">
              Search recorded schemes
              <input
                aria-label="Search irrigation schemes"
                type="search"
                className={`${control} mt-1`}
                value={registryQuery}
                onChange={(e) => setRegistryQuery(e.target.value)}
                placeholder="Scheme, district, method, or type…"
              />
            </label>
            <div className="mt-4">
              <ResponsiveTable
                aria-label="Geographic irrigation scheme registry, not a seasonal inventory"
                className="text-left text-sm"
              >
                <thead className="bg-slate-50 text-xs">
                  <tr>
                    {[
                      "Scheme / district",
                      "Recorded type / method",
                      "Command / irrigable area (ha)",
                      "Recorded status",
                      "Recorded location",
                      "Season linkage / verification",
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleInventory.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <th scope="row" className="p-3 text-left">
                        <span className="block font-semibold">
                          {s.name || "Unnamed registry entry"}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                          {s.district}
                        </span>
                      </th>
                      <td className="p-3">
                        {s.type || "Not recorded"}
                        <span className="mt-1 block text-xs text-slate-500">
                          {s.method || "Method not recorded"}
                        </span>
                      </td>
                      <td className="p-3">
                        {fmt(s.command_area)} / {fmt(s.irrigable_area)}
                      </td>
                      <td className="p-3">{s.status || "Not recorded"}</td>
                      <td className="p-3">
                        {s.latitude !== null && s.longitude !== null ? (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=12/${s.latitude}/${s.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-800 underline"
                          >
                            {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                          </a>
                        ) : (
                          "Not recorded"
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        {selectedSchemeIds.has(s.id)
                          ? `Linked to ${season}`
                          : "Not linked to this season"}
                        <span className="mt-1 block text-slate-500">
                          {s.last_verified_at
                            ? `Verification date: ${String(s.last_verified_at).slice(0, 10)}`
                            : "Verification date not recorded"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
              {!visibleInventory.length && (
                <p className="py-5 text-center text-sm text-slate-500">
                  No registry entries match this geography or search.
                </p>
              )}
            </div>
          </>
        )}
      </section>
      <section className={panel} aria-labelledby="irrigation-production">
        <h2 id="irrigation-production" className="text-lg font-bold">
          Irrigation and agricultural production
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Compare production with irrigation indicators in the same selected
          geography and period.
        </p>
        <p className="my-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          This table includes crop output in the {positiveDistricts.size}{" "}
          selected district(s) with an available{" "}
          {category === "ALL" ? "irrigated" : category} area greater than zero
          in {season}. Output includes rainfed agriculture and is not attributed
          to irrigation. Comparison production uses this same district cohort.
          These indicators do not establish cause and effect.
        </p>
        <ResponsiveTable
          aria-label="Irrigation and production comparison by district"
          className="text-left text-sm"
        >
          <thead className="bg-slate-50 text-xs">
            <tr>
              {[
                "District",
                "Irrigated area (ha)",
                "Irrigation coverage (%)",
                "Crop production (tonnes)",
                "Crop cultivated area (ha)",
                "Yield (tonnes/ha)",
              ].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentDistricts
              .filter((r) => positiveDistricts.has(r.name))
              .map((r) => {
                const p = productionByDistrict.get(r.name);
                return (
                  <tr key={r.name} className="border-b border-slate-100">
                    <th scope="row" className="p-3">
                      {r.name}
                    </th>
                    <td className="p-3">{fmt(r.irrigated)}</td>
                    <td className="p-3">{fmt(r.coverage, 2)}</td>
                    <td className="p-3">{fmt(p?.production ?? null)}</td>
                    <td className="p-3">{fmt(p?.area ?? null)}</td>
                    <td className="p-3">{fmt(p?.yield ?? null, 2)}</td>
                  </tr>
                );
              })}
          </tbody>
        </ResponsiveTable>
        <details className="mt-5" open={district !== "ALL"}>
          <summary className="cursor-pointer text-sm font-semibold text-cyan-800">
            Crops cultivated in these districts · production and seasonal
            comparison
          </summary>
          <div className="mt-3">
            <ResponsiveTable
              aria-label="Crops cultivated in districts with irrigation records"
              className="text-left text-sm"
            >
              <thead className="bg-slate-50 text-xs">
                <tr>
                  {[
                    "Crop",
                    "Production (tonnes)",
                    "Cultivated crop area (ha)",
                    "Yield (tonnes/ha)",
                    compare
                      ? `Production change vs ${compare}`
                      : "Production change",
                    compare ? `Area change vs ${compare}` : "Area change",
                  ].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productionRows.map((r) => (
                  <tr key={r.name} className="border-b border-slate-100">
                    <th scope="row" className="p-3">
                      {r.name}
                    </th>
                    <td className="p-3">{fmt(r.production)}</td>
                    <td className="p-3">{fmt(r.area)}</td>
                    <td className="p-3">{fmt(r.yield, 2)}</td>
                    <td className="p-3">
                      {compare
                        ? delta(
                            irrigationChange(
                              r.production,
                              r.previous.production,
                            ),
                          )
                        : "Select a comparison"}
                    </td>
                    <td className="p-3">
                      {compare
                        ? delta(irrigationChange(r.area, r.previous.area))
                        : "Select a comparison"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        </details>
        {!productionRows.length && (
          <p className="mt-4 text-sm text-slate-500">
            No crop production records overlap the selected irrigation geography
            and period.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Production uses crop_statistics, a separate source from the district
          irrigation series. Crop-area sums may include intercropping and are
          not necessarily unique land coverage. Yield is production / harvested
          area using compatible pairs; it is not irrigation-specific yield.
        </p>
      </section>
      <section
        className={`${panel} scroll-mt-32`}
        aria-labelledby="irrigation-downloads"
      >
        <h2
          id="irrigation-downloads"
          className="scroll-mt-32 text-lg font-bold"
        >
          Irrigation data and download center
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Download filtered records, district comparisons, or seasonal
          summaries. CSVs preserve unavailable values as empty cells and include
          filters and evidence classifications.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          <button
            className={button}
            disabled={!current.length}
            onClick={exportCurrent}
          >
            <Download size={16} /> Filtered irrigation CSV
          </button>
          <button
            className={button}
            disabled={!rankingRows.length}
            onClick={exportDistricts}
          >
            District comparison CSV
          </button>
          <button className={button} onClick={exportSeasons}>
            Seasonal irrigation CSV
          </button>
        </div>
        <div id="irrigation-sources" className="scroll-mt-32">
          <h3 className="mb-3 font-semibold">
            Data sources, periods, and definitions
          </h3>
          <dl className="grid gap-5 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Selected reporting scope</dt>
              <dd className="mt-1 text-slate-500">
                {scopeLabel}. {summary.records} district records;{" "}
                {fmt(summary.districts, 0)} district(s) with available irrigated
                area. Available periods: {seasons.slice().sort().join(", ")}.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Evidence and source lineage</dt>
              <dd className="mt-1 text-slate-500">
                {evidence}. {summary.modelled} of {summary.records} selected
                irrigation records are explicitly marked model-generated.
                References below are stored database citations, not independent
                verification of the original publications.
              </dd>
            </div>
            {Object.entries(data.methodology).map(([key, text]) => (
              <div key={key}>
                <dt className="font-semibold capitalize">
                  {key.replace(/Basis$/, " basis").replaceAll("_", " ")}
                </dt>
                <dd className="mt-1 text-slate-500">{text}</dd>
              </div>
            ))}
            <div>
              <dt className="font-semibold">Change units</dt>
              <dd className="mt-1 text-slate-500">
                Coverage differences are percentage points (pp). Relative
                percentage change divides by the comparison value and is
                unavailable for a zero baseline. Coverage and non-irrigated
                totals use compatible pairs, not unmatched district totals.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">
                Missing values and scope differences
              </dt>
              <dd className="mt-1 text-slate-500">
                No record is not zero. Irrigated area and cultivated area are in
                hectares; scheme counts and infrastructure areas are distinct.
                Source coverage may change between seasons. Schemes without
                season links are excluded from seasonal counts.
              </dd>
            </div>
          </dl>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-cyan-800">
              View source references in the selected results (
              {references.length})
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-slate-500">
              {references.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}

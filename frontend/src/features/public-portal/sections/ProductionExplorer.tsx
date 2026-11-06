import ResponsiveTable from "../../../components/ResponsiveTable";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Download,
  Filter,
  MapPin,
  Sprout,
  TrendingUp,
  RefreshCw,
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
import { RWANDA_REAL_DISTRICTS } from "../../landing/components/rwandaRealPaths";
import {
  numeric,
  selectRecords,
  summarize,
  groupRecords,
  percentChange,
} from "../productionModel";
import type { ProductionRecord } from "../productionModel";

const fmt = (n: number | null, digits = 1) =>
  n === null
    ? "Not available"
    : n.toLocaleString("en-GB", { maximumFractionDigits: digits });
const change = (n: number | null) =>
  n === null ? "Not comparable" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const control =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-40";
const panel =
  "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm";
type Metric = "production" | "area" | "yield";
const metrics: Record<Metric, { label: string; unit: string }> = {
  production: { label: "Production", unit: "tonnes" },
  area: { label: "Cultivated area", unit: "ha" },
  yield: { label: "Yield", unit: "tonnes/ha" },
};

function download(name: string, rows: unknown[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          let text = value === null || value === undefined ? "" : String(value);
          if (/^[=+@\-]/.test(text) && typeof value !== "number")
            text = "'" + text;
          return '"' + text.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ProductionExplorer({
  initialDistrict = "ALL",
}: {
  initialDistrict?: string;
}) {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [source, setSource] = useState("");
  const [reportingNote, setReportingNote] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  const [season, setSeason] = useState("");
  const [compare, setCompare] = useState("");
  const [province, setProvince] = useState("ALL");
  const [district, setDistrict] = useState(initialDistrict);
  const [crop, setCrop] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("production");
  const [ascending, setAscending] = useState(false);
  const [lowest, setLowest] = useState(false);
  const [metric, setMetric] = useState<Metric>("production");
  const [hovered, setHovered] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setRecords([]);
    fetch(`${API_BASE_URL}/crop-statistics/public-production`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Production request failed");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data.records))
          throw new Error("Invalid production response");
        const normalized: ProductionRecord[] = data.records.map(
          (r: ProductionRecord) => ({
            ...r,
            year: Number(r.year),
            production: numeric(r.production),
            area: numeric(r.area),
            harvested: numeric(r.harvested),
          }),
        );
        const seasons = [...new Set(normalized.map((r) => r.season_code))]
          .sort()
          .reverse();
        const latest = seasons[0] || "";
        setRecords(normalized);
        setSource(data.source || "AgriLens production records");
        setReportingNote(data.reportingNote || "");
        setSeason(latest);
        const equivalent = `${Number(latest.slice(0, 4)) - 1}${latest.slice(-1)}`;
        setCompare(seasons.includes(equivalent) ? equivalent : "");
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [retry]);

  const seasons = useMemo(
    () => [...new Set(records.map((r) => r.season_code))].sort().reverse(),
    [records],
  );
  const provinces = [
    ...new Set(records.map((r) => r.province).filter(Boolean)),
  ].sort();
  const districts = [
    ...new Set(
      records
        .filter((r) => province === "ALL" || r.province === province)
        .map((r) => r.district),
    ),
  ].sort();
  const crops = [...new Set(records.map((r) => r.crop))].sort();
  const scope = { province, district, crop };
  const current = selectRecords(records, scope, season);
  const previous = compare ? selectRecords(records, scope, compare) : [];
  const summary = summarize(current);
  const sourceDescriptions = [
    ...new Set(
      current
        .map((r) =>
          [
            r.source_provider,
            r.source_name,
            r.dataset_name,
            r.dataset_version ? `version ${r.dataset_version}` : null,
          ]
            .filter(Boolean)
            .join(" / "),
        )
        .filter(Boolean),
    ),
  ];
  const cropRows = groupRecords(current, "crop");
  const previousCrops = new Map(
    groupRecords(previous, "crop").map((r) => [r.name, r]),
  );
  const tableRows = cropRows
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name")
        return a.name.localeCompare(b.name) * (ascending ? 1 : -1);
      const av = a[sort as Metric],
        bv = b[sort as Metric];
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      return (av - bv) * (ascending ? 1 : -1);
    });
  const rankedCrops = cropRows
    .filter((r) => r.production !== null)
    .sort((a, b) => (a.production! - b.production!) * (lowest ? 1 : -1));
  const districtRows = groupRecords(current, "district").sort(
    (a, b) => (b.production ?? -1) - (a.production ?? -1),
  );
  const trends = seasons
    .slice()
    .sort()
    .map((code) => ({
      name: code,
      ...summarize(selectRecords(records, scope, code)),
    }));
  const location =
    district !== "ALL"
      ? `${district} District`
      : province !== "ALL"
        ? province
        : "Rwanda";
  const scopeLabel = `${location} · ${season || "No season"} · ${crop === "ALL" ? "All crops" : crop}`;
  const metricInfo = metrics[metric];
  const max = Math.max(...districtRows.map((r) => r[metric] ?? 0), 1);
  const mapByDistrict = new Map(
    districtRows.map((r) => [r.name.toLowerCase(), r]),
  );
  const activeDistrict = mapByDistrict.get((hovered || district).toLowerCase());
  const bounds = "0 0 600 528";
  function setSelectedSeason(code: string) {
    setSeason(code);
    if (compare === code) setCompare("");
  }
  function exportCrops() {
    download(`agrilens-crops-${season}-${district}.csv`, [
      [
        "Season",
        "Province filter",
        "District filter",
        "Crop filter",
        "Crop",
        "Production (tonnes)",
        "Cultivated area (ha)",
        "Yield (tonnes/ha)",
        "Comparison season",
        "Production change (%)",
        "Partial records",
        "Source",
      ],
      ...tableRows.map((r) => [
        season,
        province,
        district,
        crop,
        r.name,
        r.production,
        r.area,
        r.yield,
        compare,
        percentChange(
          r.production,
          previousCrops.get(r.name)?.production ?? null,
        ),
        r.partial,
        source,
      ]),
    ]);
  }
  function exportChart() {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = `Crop production (tonnes): ${scopeLabel}`;
    copy.prepend(title);
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(copy)], {
        type: "image/svg+xml",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `agrilens-crop-production-${season}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (status === "loading")
    return (
      <div
        role="status"
        className={`${panel} py-16 text-center text-slate-600`}
      >
        Loading agricultural production records…
      </div>
    );
  if (status === "error")
    return (
      <div role="alert" className={`${panel} space-y-4`}>
        <h2 className="text-lg font-bold">
          Production data could not be loaded
        </h2>
        <p className="text-slate-600">
          The production service is unavailable. Please try again.
        </p>
        <button className={button} onClick={() => setRetry((r) => r + 1)}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  if (!records.length)
    return (
      <div className={panel}>
        <h2 className="font-bold">
          No agricultural production records available
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Production indicators will appear when district crop records are
          published.
        </p>
      </div>
    );

  return (
    <div className="space-y-8 text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Agricultural Production
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Explore what Rwanda grows
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Discover district crop production, compare seasons, and explore the
            geography of Rwanda’s harvests.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900">
          {scopeLabel}
        </span>
      </header>

      <section aria-labelledby="production-overview">
        <h2 id="production-overview" className="mb-3 text-lg font-bold">
          {location === "Rwanda"
            ? "National production overview"
            : `${location} production overview`}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Selected records: {scopeLabel}. Totals include available measurements.
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total production", summary.production, "tonnes harvested"],
            ["Crops cultivated", summary.crops, "crops with records"],
            ["Cultivated area", summary.area, "hectares (crop-area sum)"],
            ["Average yield", summary.yield, "tonnes / harvested hectare"],
          ].map(([label, value, unit]) => (
            <div key={String(label)} className={panel}>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-3 break-words text-2xl font-bold text-emerald-950">
                {fmt(
                  value as number | null,
                  label === "Crops cultivated" ? 0 : 2,
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">{unit}</p>
            </div>
          ))}
        </div>
        {summary.partial && (
          <p className="mt-3 text-sm text-amber-800" role="status">
            Some measurements are missing. Totals reflect available values;
            rankings and shares may be incomplete.
          </p>
        )}
      </section>

      <section className={panel} aria-labelledby="production-filters">
        <h2
          id="production-filters"
          className="mb-4 flex items-center gap-2 text-lg font-bold"
        >
          <Filter size={18} className="text-emerald-700" /> Production filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-xs font-semibold">
            Agricultural year
            <select
              aria-label="Agricultural year"
              className={control}
              value={season.slice(0, 4)}
              onChange={(e) => {
                const code =
                  seasons.find(
                    (s) => s === e.target.value + season.slice(-1),
                  ) || seasons.find((s) => s.startsWith(e.target.value));
                if (code) setSelectedSeason(code);
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
              aria-label="Season"
              className={control}
              value={season}
              onChange={(e) => setSelectedSeason(e.target.value)}
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
              aria-label="Comparison season"
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
              aria-label="Province"
              className={control}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setDistrict("ALL");
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
              aria-label="District"
              className={control}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="ALL">All districts in scope</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold">
            Crop
            <select
              aria-label="Crop"
              className={control}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              <option value="ALL">All crops</option>
              {crops.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            All results use this scope. Historical trends vary only the season.
          </p>
          <button
            className={button}
            onClick={() => {
              setProvince("ALL");
              setDistrict("ALL");
              setCrop("ALL");
              setQuery("");
            }}
          >
            Clear geographic and crop filters
          </button>
        </div>
      </section>

      {!current.length && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          No records match {scopeLabel}. Try another season, district, or crop.
          Missing records do not indicate zero production.
        </div>
      )}

      <section className={panel} aria-labelledby="district-crops">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="district-crops"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <Sprout size={20} className="text-emerald-700" /> Crop production
              by district
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {district === "ALL"
                ? "Select a district for its crop breakdown. Currently showing totals for " +
                  location +
                  "."
                : "Crop records for " + district + " District."}{" "}
              {season} — {crop === "ALL" ? "All crops" : crop}
            </p>
          </div>
          <button
            className={button}
            disabled={!tableRows.length}
            onClick={exportCrops}
          >
            <Download size={16} /> Export table CSV
          </button>
        </div>
        <div className="my-4 flex flex-wrap gap-3">
          <label className="flex-1 text-xs font-semibold">
            Search crops
            <input
              className={`${control} mt-1 min-w-40`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a crop…"
            />
          </label>
          <label className="text-xs font-semibold">
            Sort by
            <select
              aria-label="Sort by"
              className={`${control} mt-1`}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="production">Production</option>
              <option value="name">Crop name</option>
              <option value="area">Cultivated area</option>
              <option value="yield">Yield</option>
            </select>
          </label>
          <button
            className={`${button} self-end`}
            onClick={() => setAscending((v) => !v)}
          >
            {ascending ? "Ascending ↑" : "Descending ↓"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <ResponsiveTable className="w-full text-left text-sm">
            <caption className="sr-only">
              Crop production for {scopeLabel}
            </caption>
            <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                {[
                  "Crop",
                  "Production (tonnes)",
                  "Contribution",
                  "Cultivated area (ha)",
                  "Yield (tonnes/ha)",
                  compare ? `Change vs ${compare}` : "Comparison",
                ].map((h) => (
                  <th key={h} className="px-3 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r.name} className="border-b border-slate-100">
                  <th scope="row" className="px-3 py-3 font-semibold">
                    {r.name}
                    {r.partial && (
                      <span className="block text-xs font-normal text-amber-700">
                        Partial measurements
                      </span>
                    )}
                  </th>
                  <td className="px-3 py-3 tabular-nums">
                    {fmt(r.production)}
                  </td>
                  <td className="px-3 py-3">
                    {r.production !== null &&
                    summary.production !== null &&
                    summary.production > 0
                      ? `${((r.production / summary.production) * 100).toFixed(1)}%`
                      : "Not available"}
                  </td>
                  <td className="px-3 py-3 tabular-nums">{fmt(r.area)}</td>
                  <td className="px-3 py-3 tabular-nums">{fmt(r.yield, 2)}</td>
                  <td className="px-3 py-3">
                    {compare
                      ? change(
                          percentChange(
                            r.production,
                            previousCrops.get(r.name)?.production ?? null,
                          ),
                        )
                      : "Select a season"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50 font-bold">
                <th className="px-3 py-3" scope="row">
                  Scope total ({cropRows.length} crops)
                </th>
                <td className="px-3 py-3">{fmt(summary.production)}</td>
                <td className="px-3 py-3">—</td>
                <td className="px-3 py-3">{fmt(summary.area)}</td>
                <td className="px-3 py-3">{fmt(summary.yield, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </ResponsiveTable>
          {!tableRows.length && (
            <p className="py-6 text-center text-sm text-slate-500">
              No crops match the current selection or search.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Search affects this table and its export. Scope totals include all
          crops selected in the filters. Contribution is a share of recorded
          production in this scope.
        </p>
      </section>

      <section className={panel} aria-labelledby="crop-rankings">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="crop-rankings"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <BarChart3 size={20} className="text-emerald-700" />{" "}
              {location === "Rwanda"
                ? "National crop rankings"
                : `${location} crop rankings`}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {scopeLabel} ? Up to 10 crops ranked by recorded production.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className={button}
              aria-pressed={!lowest}
              onClick={() => setLowest(false)}
            >
              Highest
            </button>
            <button
              className={button}
              aria-pressed={lowest}
              onClick={() => setLowest(true)}
            >
              Lowest
            </button>
          </div>
        </div>
        <div ref={chartRef} className="mt-5 h-80">
          {rankedCrops.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankedCrops.slice(0, 10)}
                layout="vertical"
                margin={{ left: 5, right: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => Number(v).toLocaleString()}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(v) => [`${fmt(Number(v))} tonnes`, "Production"]}
                />
                <Bar
                  dataKey="production"
                  fill="#15803d"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="pt-12 text-center text-sm text-slate-500">
              No recorded production to rank.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Production (tonnes). Lowest ranks include recorded zeroes and exclude
          missing measurements. See the sortable crop table for contribution,
          area, and yield.
        </p>
      </section>

      <section className={panel} aria-labelledby="district-comparison">
        <h2
          id="district-comparison"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <MapPin size={20} className="text-emerald-700" /> District production
          comparison
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {scopeLabel}.{" "}
          {district !== "ALL"
            ? "One district is selected. Choose all districts to compare across the current province."
            : "Districts ranked by recorded harvest volume."}
        </p>
        <div className="mt-5 h-80">
          {districtRows.some((r) => r.production !== null) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtRows.filter((r) => r.production !== null)}
                margin={{ bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-55}
                  textAnchor="end"
                  interval={0}
                  fontSize={10}
                />
                <YAxis
                  fontSize={11}
                  tickFormatter={(v) => Number(v).toLocaleString()}
                />
                <Tooltip
                  formatter={(v) => [`${fmt(Number(v))} tonnes`, "Production"]}
                />
                <Bar dataKey="production" fill="#047857" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">
              No district production available.
            </p>
          )}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
            View all district ranks and values
          </summary>
          <div className="mt-3 overflow-x-auto">
            <ResponsiveTable className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Rank</th>
                  <th className="p-2">District</th>
                  <th className="p-2">Production (tonnes)</th>
                </tr>
              </thead>
              <tbody>
                {districtRows.map((r, i) => (
                  <tr key={r.name} className="border-t border-slate-100">
                    <td className="p-2">
                      {r.production === null ? "Unranked" : i + 1}
                    </td>
                    <td className="p-2">
                      <button
                        className="text-emerald-800 underline"
                        onClick={() => setDistrict(r.name)}
                      >
                        {r.name}
                      </button>
                    </td>
                    <td className="p-2">{fmt(r.production)}</td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        </details>
      </section>

      <section className={panel} aria-labelledby="seasonal-trends">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="seasonal-trends"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <TrendingUp size={20} className="text-emerald-700" /> Seasonal
              production trends
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {location} — {crop === "ALL" ? "All crops" : crop}. Available
              seasons across all recorded years.
            </p>
          </div>
          <label className="text-xs font-semibold">
            Trend and map indicator
            <select
              aria-label="Trend and map indicator"
              className={`${control} mt-1`}
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
            >
              {Object.entries(metrics).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} ({item.unit})
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {compare
            ? `${season} compared with ${compare}: ${change(percentChange(summary[metric], summarize(previous)[metric]))} in ${metricInfo.label.toLowerCase()}.`
            : "Select a comparison season to calculate changes."}{" "}
          {compare && season.slice(-1) !== compare.slice(-1)
            ? "Different agricultural seasons: interpret differences in their seasonal context."
            : "Equivalent seasons across years provide a more consistent comparison."}{" "}
          Changes require both values and a nonzero baseline. Coverage can
          differ between seasons.
        </p>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis
                fontSize={11}
                tickFormatter={(v) => Number(v).toLocaleString()}
              />
              <Tooltip
                formatter={(v) => [
                  `${fmt(Number(v), 2)} ${metricInfo.unit}`,
                  metricInfo.label,
                ]}
              />
              <Line
                type="linear"
                dataKey={metric}
                stroke="#15803d"
                strokeWidth={3}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 overflow-x-auto">
          <ResponsiveTable className="w-full text-left text-sm">
            <caption className="sr-only">
              Seasonal production, area and yield for {location}
            </caption>
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Season",
                  "Production (tonnes)",
                  "Cultivated area (ha)",
                  "Yield (tonnes/ha)",
                  `Change vs ${compare || "—"}`,
                ].map((h) => (
                  <th key={h} className="p-3 text-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trends.map((r) => (
                <tr
                  key={r.name}
                  className={`border-b border-slate-100 ${r.name === season ? "bg-emerald-50 font-semibold" : ""}`}
                >
                  <th scope="row" className="p-3">
                    {r.name}
                  </th>
                  <td className="p-3">{fmt(r.production)}</td>
                  <td className="p-3">{fmt(r.area)}</td>
                  <td className="p-3">{fmt(r.yield, 2)}</td>
                  <td className="p-3">
                    {compare && r.name !== compare
                      ? change(
                          percentChange(r[metric], summarize(previous)[metric]),
                        )
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Change column uses {metricInfo.label.toLowerCase()}. Crop-level
          increases and decreases appear in the crop table above.
        </p>
      </section>

      <section className={panel} aria-labelledby="production-map">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 id="production-map" className="text-lg font-bold">
              Interactive Rwanda production map
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {scopeLabel} — {metricInfo.label} ({metricInfo.unit}). Select a
              district to update every result.
            </p>
          </div>
          <label className="text-xs font-semibold">
            Map layer
            <select
              aria-label="Map layer"
              className={`${control} mt-1`}
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
            >
              {Object.entries(metrics).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} ({item.unit})
                </option>
              ))}
            </select>
          </label>
          <button className={button} onClick={() => setDistrict("ALL")}>
            Show all districts in scope
          </button>
        </div>
        <div className="mt-4 grid items-center gap-5 md:grid-cols-[2fr_1fr]">
          <svg
            viewBox={bounds}
            className="mx-auto max-h-[500px] w-full"
            role="group"
            aria-label={`Rwanda district map: ${metricInfo.label}, ${scopeLabel}`}
          >
            {RWANDA_REAL_DISTRICTS.map((shape) => {
              const row = mapByDistrict.get(shape.name.toLowerCase()),
                value = row?.[metric] ?? null;
              const inProvince =
                province === "ALL" ||
                records.some(
                  (r) => r.district === shape.name && r.province === province,
                );
              return (
                <path
                  key={shape.name}
                  d={shape.d}
                  role="button"
                  tabIndex={inProvince ? 0 : -1}
                  aria-disabled={!inProvince}
                  aria-label={`${shape.name}: ${fmt(value)} ${value === null ? "" : metricInfo.unit}`}
                  aria-pressed={district === shape.name}
                  fill={
                    value === null
                      ? "#e2e8f0"
                      : `hsl(145, 55%, ${88 - (value / max) * 57}%)`
                  }
                  stroke={
                    district === shape.name || hovered === shape.name
                      ? "#052e16"
                      : "white"
                  }
                  strokeWidth={district === shape.name ? 3 : 1}
                  className={
                    inProvince
                      ? "cursor-pointer focus:outline-none focus:stroke-amber-500"
                      : "opacity-30"
                  }
                  onMouseEnter={() => setHovered(shape.name)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(shape.name)}
                  onBlur={() => setHovered(null)}
                  onClick={() => {
                    if (inProvince) setDistrict(shape.name);
                  }}
                  onKeyDown={(e) => {
                    if (inProvince && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setDistrict(shape.name);
                    }
                  }}
                >
                  <title>
                    {shape.name}: {fmt(value)}{" "}
                    {value === null ? "" : metricInfo.unit}
                  </title>
                </path>
              );
            })}
          </svg>
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-5" aria-live="polite">
              <h3 className="font-bold">
                {hovered ||
                  (district !== "ALL" ? district : "Explore a district")}
              </h3>
              <p className="mt-2 text-sm">
                {activeDistrict
                  ? `${metricInfo.label}: ${fmt(activeDistrict[metric], 2)} ${activeDistrict[metric] === null ? "" : metricInfo.unit}`
                  : "Hover, focus, or select a district to see its recorded value."}
              </p>
              {activeDistrict && (
                <dl className="mt-3 space-y-2 text-xs">
                  <div>
                    <dt>Production</dt>
                    <dd>{fmt(activeDistrict.production)} tonnes</dd>
                  </div>
                  <div>
                    <dt>Cultivated area</dt>
                    <dd>{fmt(activeDistrict.area)} ha</dd>
                  </div>
                  <div>
                    <dt>Yield</dt>
                    <dd>{fmt(activeDistrict.yield, 2)} tonnes/ha</dd>
                  </div>
                </dl>
              )}
            </div>
            <div className="text-xs text-slate-500">
              <div className="mb-2 h-3 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-800" />
              <div className="flex justify-between">
                <span>0 {metricInfo.unit}</span>
                <span>
                  {fmt(
                    districtRows.length
                      ? Math.max(...districtRows.map((r) => r[metric] ?? 0))
                      : null,
                  )}{" "}
                  {metricInfo.unit}
                </span>
              </div>
              <p className="mt-3">
                <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-slate-200" />
                Grey: no measurement in the selected scope.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Map boundaries use the district geometry bundled with AgriLens.
              The district table provides a keyboard accessible alternative.
            </p>
          </div>
        </div>
      </section>

      <section className={panel} aria-labelledby="production-downloads">
        <h2 id="production-downloads" className="text-lg font-bold">
          Data and download center
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Download the selected records, chart, or seasonal comparison. Empty
          CSV cells indicate unavailable measurements.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          <button
            className={button}
            disabled={!current.length}
            onClick={() =>
              download(`agrilens-records-${season}-${district}.csv`, [
                [
                  "Season",
                  "Year",
                  "Province",
                  "District",
                  "Crop",
                  "Production (tonnes)",
                  "Cultivated area (ha)",
                  "Harvested area (ha)",
                  "Source",
                ],
                ...current.map((r) => [
                  r.season_code,
                  r.year,
                  r.province,
                  r.district,
                  r.crop,
                  r.production,
                  r.area,
                  r.harvested,
                  source,
                ]),
              ])
            }
          >
            <Download size={16} /> Filtered data CSV
          </button>
          <button
            className={button}
            disabled={!rankedCrops.length}
            onClick={exportChart}
          >
            Crop chart SVG
          </button>
          <button
            className={button}
            disabled={!compare}
            onClick={() =>
              download(`agrilens-season-comparison-${season}-${compare}.csv`, [
                [
                  "Season",
                  "Province filter",
                  "District filter",
                  "Crop filter",
                  "Production (tonnes)",
                  "Cultivated area (ha)",
                  "Yield (tonnes/ha)",
                  "Comparison season",
                  "Production change (%)",
                  "Area change (%)",
                  "Yield change (%)",
                  "Source",
                ],
                ...trends.map((r) => {
                  const baseline = summarize(previous);
                  return [
                    r.name,
                    province,
                    district,
                    crop,
                    r.production,
                    r.area,
                    r.yield,
                    compare,
                    percentChange(r.production, baseline.production),
                    percentChange(r.area, baseline.area),
                    percentChange(r.yield, baseline.yield),
                    source,
                  ];
                }),
              ])
            }
          >
            Season comparison CSV
          </button>
        </div>
        <dl className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Data source</dt>
            <dd className="mt-1 text-slate-500">
              {source}. {reportingNote}
              {sourceDescriptions.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {sourceDescriptions.map((description) => (
                    <li key={description}>{description}</li>
                  ))}
                </ul>
              )}
              {current.some((r) => !r.source_name && !r.dataset_name) && (
                <p className="mt-2">
                  Some records have no linked source metadata.
                </p>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Reporting and coverage</dt>
            <dd className="mt-1 text-slate-500">
              {scopeLabel}. {summary.records} records; {districtRows.length}{" "}
              districts in the selected results. Available reporting periods:{" "}
              {seasons.slice().sort().join(", ")}.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Units and yield calculation</dt>
            <dd className="mt-1 text-slate-500">
              Production is harvested output in tonnes. Cultivated area is crop
              area in hectares; summed crop areas may include intercropping and
              are not unique land coverage. Yield is production / harvested
              hectares, weighted using only records with both measurements and
              positive harvested area.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">
              Missing values and comparison limits
            </dt>
            <dd className="mt-1 text-slate-500">
              Missing measurements remain unavailable; recorded zeroes are
              retained. Percentage changes need a nonzero baseline. Seasonal
              totals can have different crop and district coverage; changes
              describe available records.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

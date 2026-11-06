import { useEffect, useState } from "react";
import type { CommerceScope, SeasonalStorage } from "../commerceModel";
import {
  productionRows,
  registryRows,
  storageRows,
  groupProduction,
  total,
  percentDifference,
} from "../commerceModel";
import {
  useCommerce,
  CommerceFilters,
  FacilityDirectory,
  LoadState,
  facilityColumns,
  facilityCsv,
} from "../components/CommerceTools";
import {
  Panel,
  Notice,
  Stats,
  Field,
  DataTable,
  Chart,
  CsvButton,
  ChartExport,
  controlClass,
  format,
} from "../components/EvidenceUI";
import PublicChoropleth from "../components/PublicChoropleth";
import { DISTRICT_PROVINCES } from "../publicPortalApi";
const indicators = {
  storage: { label: "Estimated storage capacity", unit: "tonnes" },
  processing: { label: "Estimated processing capacity", unit: "tonnes/day" },
  cold: { label: "Estimated cold storage capacity", unit: "tonnes" },
  drying: { label: "Estimated drying capacity", unit: "tonnes/day" },
  facilities: { label: "Estimated facility count", unit: "facilities" },
  loss_pct: { label: "Assumed post-harvest loss", unit: "%" },
};
type Indicator = keyof typeof indicators;
export default function PostHarvestExplorer({
  initialDistrict = "ALL",
  onDistrictChange,
}: {
  initialDistrict?: string;
  onDistrictChange: (d: string) => void;
}) {
  const { data, error, retry } = useCommerce("post-harvest");
  const [scope, setScopeState] = useState<CommerceScope>({
      district: initialDistrict,
      province: "ALL",
      crop: "ALL",
      facilityType: "ALL",
    }),
    [season, setSeason] = useState(""),
    [compare, setCompare] = useState(""),
    [indicator, setIndicator] = useState<Indicator>("storage"),
    [inventory, setInventory] = useState(true);
  const setScope = (s: CommerceScope) => {
    setScopeState(s);
    onDistrictChange(s.district);
  };
  useEffect(() => {
    if (data)
      setSeason(
        [
          ...new Set([
            ...(data.records || []).map((r) => r.season_code),
            ...data.production.map((r) => r.season_code),
          ]),
        ]
          .sort()
          .at(-1) || "",
      );
  }, [data]);
  if (!data)
    return <LoadState error={error} retry={retry} label="Post-harvest" />;
  const periods = [
    ...new Set([
      ...(data.records || []).map((r) => r.season_code),
      ...data.production.map((r) => r.season_code),
    ]),
  ]
    .sort()
    .reverse();
  const rows = storageRows(data, scope, season),
    previous = storageRows(data, scope, compare),
    before = new Map(previous.map((r) => [r.district, r]));
  const matchingRegistry = registryRows(data, scope);
  const registry = inventory ? matchingRegistry : [],
    production = productionRows(data, scope, season),
    districtProduction = groupProduction(production, "district");
  const metadata = indicators[indicator];
  const ranking = rows
    .map((r) => ({ name: r.district, value: r[indicator] }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  const aggregate = (r: SeasonalStorage[]) =>
    indicator === "loss_pct" ? null : total(r.map((r) => r[indicator]));
  const trends = periods
    .toReversed()
    .map((p) => ({ name: p, value: aggregate(storageRows(data, scope, p)) }));
  const districtColumns = [
    "District",
    metadata.label + " (" + metadata.unit + ")",
    "Comparison (" + metadata.unit + ")",
    "Change (%)",
    "Evidence",
  ];
  const districtCsv = rows.map((r) => [
    r.district,
    r[indicator],
    before.get(r.district)?.[indicator] ?? null,
    percentDifference(r[indicator], before.get(r.district)?.[indicator]),
    r.evidence,
  ]);
  const allowed = Object.keys(DISTRICT_PROVINCES).filter(
    (d) => scope.province === "ALL" || DISTRICT_PROVINCES[d] === scope.province,
  );
  return (
    <div className="space-y-6">
      <Panel
        title="National Post-Harvest Overview"
        note={`${season} | ${scope.district === "ALL" ? (scope.province === "ALL" ? "Rwanda" : scope.province) : scope.district}. Registry counts are current recorded entries, not seasonal model counts.`}
      >
        <Stats
          items={[
            {
              label: "Registered storage capacity (tonnes)",
              value: format(total(matchingRegistry.map((r) => r.storage))),
              detail:
                "Registry snapshot; installed capacity as stored, not utilization",
            },
            {
              label: "Registered facilities",
              value: String(matchingRegistry.length),
              detail:
                "Distinct facility records matching the geography, crop linkage and type",
            },
            {
              label: "Districts with registered facilities",
              value: String(
                new Set(matchingRegistry.map((r) => r.district)).size,
              ),
              detail:
                "Missing evidence does not establish absent infrastructure",
            },
            {
              label: "Selected indicator records",
              value: String(rows.filter((r) => r[indicator] !== null).length),
              detail: metadata.label,
            },
          ]}
        />
        <div className="mt-4">
          <Notice>
            The seasonal storage, facility and loss statistics are generated
            estimates. They are labelled throughout and do not establish actual
            utilization, measured loss or confirmed infrastructure deficits.
          </Notice>
        </div>
      </Panel>
      <Panel
        title="Post-Harvest & Storage Filters"
        note="Crop- and facility-type-specific seasonal storage statistics are not linked in the source table. Selecting either shows their absence rather than retaining unrelated district totals."
      >
        <CommerceFilters
          data={data}
          scope={scope}
          setScope={setScope}
          season={season}
          setSeason={setSeason}
          compare={compare}
          setCompare={setCompare}
          periods={periods}
        />
        <div className="mt-4 max-w-lg">
          <Field label="Post-harvest indicator">
            <select
              className={controlClass}
              value={indicator}
              onChange={(e) => setIndicator(e.target.value as Indicator)}
            >
              {Object.entries(indicators).map(([key, i]) => (
                <option key={key} value={key}>
                  {i.label} ({i.unit})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>
      <Panel
        title="Post-Harvest Performance by District"
        note="These are modelled district-season records, not observed facility throughput."
      >
        <DataTable
          label="district post-harvest performance"
          columns={districtColumns}
          rows={districtCsv}
        />
        {indicator === "loss_pct" && (
          <Notice>
            The stored loss percentage is a seeding assumption. It is not ranked
            as measured district loss.
          </Notice>
        )}
      </Panel>
      <Panel
        id="post-harvest-ranking-chart"
        title="National District Rankings"
        note={`${metadata.label} | ${metadata.unit}. Indicators retain separate units; no combined investment score is used.`}
      >
        {indicator === "loss_pct" ? (
          <p className="text-sm text-slate-600">
            Measured loss rankings are unavailable.
          </p>
        ) : (
          <Chart rows={ranking} unit={metadata.unit} />
        )}
      </Panel>
      <Panel
        id="post-harvest-trend-chart"
        title="Seasonal Post-Harvest Trends"
        note="Model trajectories reflect baseline scaling and cannot establish historic capacity changes. Reporting coverage is shown beside every period."
      >
        <Chart rows={trends} unit={metadata.unit} line />
        <DataTable
          label="seasonal post-harvest comparisons"
          columns={[
            "Season",
            metadata.label + " (" + metadata.unit + ")",
            "District records",
            "Evidence",
          ]}
          rows={trends.map((t) => [
            t.name,
            t.value,
            storageRows(data, scope, t.name).length,
            "MODELLED_BASELINE",
          ])}
        />
      </Panel>
      <Panel
        title="Interactive Rwanda Post-Harvest & Storage Map"
        note="District shading represents the selected seasonal estimate. The directory links to stored facility coordinates; no point is inferred from a district centre."
      >
        <PublicChoropleth
          title={metadata.label}
          unit={metadata.unit}
          data={indicator === "loss_pct" ? [] : ranking}
          selectedDistrict={scope.district}
          allowedDistricts={allowed}
          onSelectDistrict={(d) => setScope({ ...scope, district: d })}
        />
      </Panel>
      <Panel
        title="Post-Harvest Facility Directory"
        note="Registry context has no seasonal attribution. It is not counted in seasonal overview statistics, and historical operation is not inferred. Crop filtering requires an explicit commodity list; missing lists do not imply incompatibility."
      >
        <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={inventory}
            onChange={(e) => setInventory(e.target.checked)}
            className="h-5 w-5"
          />
          Include undated facility registry as separate context
        </label>
        <p className="mb-3 text-sm text-slate-600">
          {registry.length} matching registry entries | Storage:{" "}
          {format(total(registry.map((f) => f.storage)))} tonnes | Processing:{" "}
          {format(total(registry.map((f) => f.processing)))} tonnes/day
        </p>
        <FacilityDirectory facilities={registry} />
      </Panel>
      <Panel
        title="Crop-Specific Post-Harvest Information"
        note="Every crop in the production source is selectable. Unlinked facility capacities and district-wide loss assumptions are not assigned to a crop."
      >
        <DataTable
          label="crop post-harvest context"
          columns={[
            "Crop",
            "Seasonal production (tonnes)",
            "Explicitly linked registry entries",
            "Seasonal crop loss",
          ]}
          rows={groupProduction(production, "crop").map((r) => [
            r.name,
            r.value,
            registry.filter(
              (f) =>
                Array.isArray(f.commodities) &&
                f.commodities.some(
                  (c: unknown) =>
                    typeof c === "string" &&
                    c.toLowerCase() === r.name.toLowerCase(),
                ),
            ).length,
            null,
          ])}
        />
      </Panel>
      <Panel
        title="Post-Harvest Gaps & Infrastructure Opportunities"
        note="Potential gaps require field assessment. Installed capacity, actual stocks, annual throughput and seasonal production are different measurements."
      >
        <DataTable
          label="infrastructure assessment"
          columns={[
            "District",
            "Seasonal production (tonnes)",
            "Modelled storage (tonnes)",
            "Assessment",
          ]}
          rows={districtProduction.map((r) => [
            r.name,
            r.value,
            rows.find((s) => s.district === r.name)?.storage ?? null,
            "Insufficient verified evidence: confirm installed capacity, utilization, demand and commodity compatibility.",
          ])}
        />
      </Panel>
      <Panel
        title="Post-Harvest & Agricultural Production Comparison"
        note="Production is from crop_statistics for the selected season. Capacity comes from an unverified baseline model. No production-minus-capacity quantity is reported as lost produce."
      >
        <DataTable
          label="production and infrastructure comparison"
          columns={[
            "District",
            "Season",
            "Production (tonnes)",
            "Estimated storage (tonnes)",
            "Estimated processing (tonnes/day)",
          ]}
          rows={districtProduction.map((r) => [
            r.name,
            season,
            r.value,
            rows.find((s) => s.district === r.name)?.storage ?? null,
            rows.find((s) => s.district === r.name)?.processing ?? null,
          ])}
        />
      </Panel>
      <Panel
        id="post-harvest-downloads"
        title="Data and Download Center"
        note="CSV exports preserve evidence, units and periods; empty values remain blank."
      >
        <div className="flex flex-wrap gap-3">
          <CsvButton
            name={"post-harvest-" + season + ".csv"}
            columns={["Season", ...districtColumns]}
            rows={districtCsv.map((r) => [season, ...r])}
            label="Download filtered statistics"
          />
          <CsvButton
            name="post-harvest-facilities-undated.csv"
            columns={facilityColumns}
            rows={facilityCsv(registry)}
            label="Download facility directory"
          />
          <CsvButton
            name="post-harvest-seasonal-comparison.csv"
            columns={["Season", "Indicator", "Value", "Unit", "Evidence"]}
            rows={trends.map((t) => [
              t.name,
              metadata.label,
              t.value,
              metadata.unit,
              "MODELLED_BASELINE",
            ])}
            label="Download seasonal comparison"
          />
          <ChartExport
            available={
              indicator !== "loss_pct" && ranking.some((r) => r.value !== null)
            }
            id="post-harvest-ranking-chart"
            name={"post-harvest-ranking-" + season}
          />
        </div>
      </Panel>
      <Panel
        id="post-harvest-sources"
        title="Sources, reporting periods and definitions"
      >
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {Object.entries(data.methodology).map(([key, value]) => (
            <p key={key}>
              <strong className="capitalize text-slate-800">{key}: </strong>
              {value}
            </p>
          ))}
          <p>
            Geography: district records across all 30 districts. Original source
            references, as stored:{" "}
            {[
              ...new Set(
                rows.flatMap((r) =>
                  Array.isArray(r.sources) ? r.sources : [],
                ),
              ),
            ].join("; ") || "No source reference for the selected filters."}
          </p>
        </div>
      </Panel>
    </div>
  );
}

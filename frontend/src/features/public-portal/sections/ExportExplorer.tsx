import { useEffect, useState } from "react";
import type { CommerceScope } from "../commerceModel";
import {
  productionRows,
  registryRows,
  tradeRows,
  groupProduction,
  total,
  percentDifference,
  inGeography,
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
  production: { label: "Agricultural production", unit: "tonnes" },
  export_quantity: { label: "Actual export quantity", unit: "tonnes" },
  export_value: { label: "Actual export value", unit: "USD" },
  export_supply: { label: "Documented export supply", unit: "tonnes" },
  model_quantity: {
    label: "Modelled national export scenario",
    unit: "tonnes",
  },
  model_value: {
    label: "Modelled national export-value scenario",
    unit: "USD",
  },
};
type Indicator = keyof typeof indicators;
export default function ExportExplorer({
  initialDistrict = "ALL",
  onDistrictChange,
}: {
  initialDistrict?: string;
  onDistrictChange: (d: string) => void;
}) {
  const { data, error, retry } = useCommerce("trade");
  const [scope, setScopeState] = useState<CommerceScope>({
      district: initialDistrict,
      province: "ALL",
      crop: "ALL",
      facilityType: "ALL",
    }),
    [season, setSeason] = useState(""),
    [compare, setCompare] = useState(""),
    [indicator, setIndicator] = useState<Indicator>(
      initialDistrict === "ALL" ? "model_value" : "production",
    ),
    [inventory, setInventory] = useState(true);
  const setScope = (s: CommerceScope) => {
    setScopeState(s);
    onDistrictChange(s.district);
  };
  useEffect(() => {
    if (!data) return;
    const codes = [
      ...new Set([
        ...(data.scenarios || []).map((r) => r.season_code),
        ...data.production.map((r) => r.season_code),
      ]),
    ].sort();
    const latest = codes.at(-1) || "";
    setSeason(latest);
    const previousYear = latest
      ? String(Number(latest.slice(0, 4)) - 1) + latest.slice(4)
      : "";
    setCompare(
      codes.includes(previousYear) ? previousYear : codes.at(-2) || "",
    );
  }, [data]);
  if (!data)
    return (
      <LoadState error={error} retry={retry} label="Export opportunities" />
    );
  const periods = [
    ...new Set([
      ...(data.scenarios || []).map((r) => r.season_code),
      ...data.production.map((r) => r.season_code),
    ]),
  ]
    .sort()
    .reverse();
  const production = productionRows(data, scope, season),
    previous = productionRows(data, scope, compare),
    crops = groupProduction(production, "crop"),
    beforeCrops = new Map(
      groupProduction(previous, "crop").map((r) => [r.name, r.value]),
    ),
    districts = groupProduction(production, "district");
  const scenarios = tradeRows(data, scope, season),
    scenarioMode = indicator.startsWith("model_"),
    metric = indicators[indicator];
  const registry = inventory ? registryRows(data, scope) : [],
    exportFacilities = registry.filter((f) => !!f.export_role);
  const cropNames = [
    ...new Set([
      ...data.production.map((r) => r.crop),
      ...(data.scenarios || []).map((r) => r.crop),
    ]),
  ]
    .filter((c) => scope.crop === "ALL" || c === scope.crop)
    .sort();
  const cropRows = cropNames.map((c) => {
    const p = crops.find((r) => r.name === c);
    return [
      c,
      p?.value ?? null,
      null,
      null,
      null,
      p
        ? "Production recorded; actual export linkage unavailable"
        : "No production record for selected geography/season; export linkage unavailable",
    ];
  });
  const ranking =
    indicator === "production"
      ? crops
      : scenarioMode
        ? scenarios
            .map((s) => ({
              name: s.crop,
              value: indicator === "model_value" ? s.value : s.quantity,
            }))
            .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
        : [];
  const measure = (period: string) =>
    indicator === "production"
      ? total(productionRows(data, scope, period).map((r) => r.production))
      : scenarioMode
        ? total(
            tradeRows(data, scope, period).map((r) =>
              indicator === "model_value" ? r.value : r.quantity,
            ),
          )
        : null;
  const trends = periods
    .toReversed()
    .map((p) => ({ name: p, value: measure(p) }));
  const modelSupply = (data.supply || []).filter(
    (r) =>
      r.season_code === season &&
      inGeography(r, scope) &&
      scope.facilityType === "ALL" &&
      (scope.crop === "ALL" ||
        r.profile_crops?.some(
          (c) => c.toLowerCase() === scope.crop.toLowerCase(),
        )),
  );
  const references = [
    ...new Set(scenarios.flatMap((r) => r.reference_destinations || [])),
  ].sort();
  const coverage = periods.toReversed().map((p) => {
    const records = productionRows(data, scope, p);
    return [
      p,
      new Set(records.map((r) => r.crop)).size,
      new Set(records.map((r) => r.district)).size,
      records.length,
      total(records.map((r) => r.production)),
      tradeRows(data, scope, p).length,
    ];
  });
  const allSourceRows = data.production.filter(
    (r) =>
      inGeography(r, scope) &&
      (scope.crop === "ALL" || r.crop === scope.crop) &&
      scope.facilityType === "ALL",
  );
  const columns = [
    "Crop",
    "Production (tonnes)",
    "Actual export quantity (tonnes)",
    "Actual export value (USD)",
    "Documented export supply (tonnes)",
    "Evidence coverage",
  ];
  return (
    <div className="space-y-6">
      <Panel
        title="National Export Overview"
        note={`${season} | ${scope.district === "ALL" ? (scope.province === "ALL" ? "Rwanda" : scope.province) : scope.district}. Actual international exports, modelled scenarios and agricultural production remain distinct.`}
      >
        <Stats
          items={[
            {
              label: "Modelled export value (USD)",
              value: format(total(scenarios.map((r) => r.value))),
              detail:
                "Planner baseline scenario; national scope only, not shipment earnings",
            },
            {
              label: "Modelled export quantity (tonnes)",
              value: format(total(scenarios.map((r) => r.quantity))),
              detail:
                "Planner scenario; actual customs quantity is unavailable",
            },
            {
              label: "Crops with production records",
              value: String(crops.length),
              detail: "Selected season and geographic scope",
            },
            {
              label: "Commodity trade profiles",
              value: String(scenarios.length),
              detail:
                "Season-specific planner profiles; every production crop remains explorable",
            },
          ]}
        />
        <div className="mt-4">
          <Notice>
            The trade table was populated using baseline assumptions, year
            factors and season shares. Generated exports and destinations are
            not presented as actual shipments, earnings or confirmed markets.
          </Notice>
        </div>
      </Panel>
      <Panel
        title="Export Exploration Filters"
        note="The crop catalog includes every recorded crop across all years and seasons. Selecting a district never allocates national export totals to it. Facility type filters apply to infrastructure; they cannot identify the farms supplying it."
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
          exportMode
        />
        <div className="mt-4 max-w-lg">
          <Field label="Export exploration indicator">
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
        title="Agricultural Crops and Export Supply"
        note="All recorded crops remain visible. Blank export values mean unavailable evidence, not that the crop has never been exported. Crop names and product forms are not automatically merged."
      >
        <DataTable
          label="all crops and export supply"
          columns={columns}
          rows={cropRows}
        />
      </Panel>
      <Panel
        id="export-trend-chart"
        title="Export Trends Across Seasons and Years"
        note={`${metric.label} (${metric.unit}). Production uses agricultural seasons. Customs periods are not inferred. Modelled trends describe scenario assumptions, not measured trade growth.`}
      >
        <Chart rows={trends} unit={metric.unit} line />
        <DataTable
          label="export seasonal comparison"
          columns={[
            "Season",
            metric.label + " (" + metric.unit + ")",
            "Production records",
            "Evidence",
          ]}
          rows={trends.map((t) => [
            t.name,
            t.value,
            productionRows(data, scope, t.name).length,
            indicator === "production"
              ? "CROP_STATISTICS"
              : scenarioMode
                ? "MODELLED_BASELINE"
                : "NO_VERIFIED_EXPORT_RECORDS",
          ])}
        />
        {compare && (
          <p className="mt-3 text-sm text-slate-600">
            Selected indicator change from {compare} to {season}:{" "}
            {format(percentDifference(measure(season), measure(compare)))}%.
            Changes from missing values or a zero baseline are unavailable.
          </p>
        )}
      </Panel>
      <Panel
        id="export-ranking-chart"
        title="Crop Rankings by Export Value and Quantity"
        note={`Selected ranking: ${metric.label}. Verified export rankings appear only with actual export evidence. Modelled national scenarios require an unrestricted national geography.`}
      >
        <Chart rows={ranking} unit={metric.unit} />
        <DataTable
          label="export indicator ranking"
          columns={[
            "Crop",
            metric.label + " (" + metric.unit + ")",
            "Evidence",
          ]}
          rows={ranking.map((r) => [
            r.name,
            r.value,
            scenarioMode ? "MODELLED_BASELINE" : "CROP_STATISTICS",
          ])}
        />
        {scenarioMode && (
          <Notice>
            Scenario values use assumed prices and seasonal shares. Unit export
            earnings and actual growth cannot be established from them.
          </Notice>
        )}
      </Panel>
      <Panel
        title="Commodity trade profiles from the National Agricultural Planner"
        note="Explore the planner's season-specific commodity catalogue. Quantities, values, imports and unit values below are baseline-model inputs and outputs, not verified customs records. Product forms and HS codes are shown as stored."
      >
        <DataTable
          label="planner commodity trade profiles"
          columns={[
            "Commodity",
            "Category",
            "HS code",
            "Modelled exports (tonnes)",
            "Modelled export value (USD)",
            "Scenario unit value (USD/tonne)",
            "Modelled imports (tonnes)",
            "Reference markets",
            "Peak months (profile)",
          ]}
          rows={scenarios.map((r) => [
            r.crop,
            r.category,
            r.hs_code,
            r.quantity,
            r.value,
            r.quantity && r.value !== null ? r.value / r.quantity : null,
            r.import_quantity,
            (r.reference_destinations || []).join(", "),
            (r.peak_months || []).join(", "),
          ])}
        />
      </Panel>
      <Panel
        title="International Markets and Destinations"
        note="No verified destination-level records are linked to the available trade statistics."
      >
        <p className="text-sm leading-relaxed text-slate-600">
          A destination map, market shares and diversification metrics are
          unavailable. Generated country lists are excluded. Investigate
          commodity- and destination-specific requirements through the official
          references below.
        </p>
        <DataTable
          searchable={false}
          label="verified export destinations"
          columns={[
            "Destination",
            "Commodity",
            "Export quantity (tonnes)",
            "Export value (USD)",
            "Reporting period",
          ]}
          rows={[]}
        />
      </Panel>
      <Panel
        title="Market exploration profiles"
        note="These countries appear in the planner's reference profiles. Their presence does not document a shipment, buyer, demand or market share. National model totals are not divided among countries."
      >
        <DataTable
          label="market reference profiles"
          columns={[
            "Reference destination",
            "Profile commodities",
            "Evidence",
            "Actual quantity",
            "Actual value",
          ]}
          rows={references.map((country) => [
            country,
            scenarios
              .filter((r) => (r.reference_destinations || []).includes(country))
              .map((r) => r.crop)
              .join(", "),
            "PLANNER_REFERENCE_PROFILE",
            null,
            null,
          ])}
        />
      </Panel>
      <Panel
        title="District Contributions to Agricultural Exports"
        note="The map shows production origin for the selected crop and season. It does not attribute international shipments, export revenue or documented export supply to a district."
      >
        <PublicChoropleth
          title="District crop production (export attribution unavailable)"
          unit="tonnes"
          data={districts}
          selectedDistrict={scope.district}
          allowedDistricts={Object.keys(DISTRICT_PROVINCES).filter(
            (d) =>
              scope.province === "ALL" ||
              DISTRICT_PROVINCES[d] === scope.province,
          )}
          onSelectDistrict={(d) => setScope({ ...scope, district: d })}
        />
        <Chart rows={districts} unit="tonnes of production" />
        <DataTable
          label="district production and export attribution"
          columns={[
            "District",
            "Production (tonnes)",
            "Documented export supply (tonnes)",
            "Export revenue (USD)",
          ]}
          rows={districts.map((r) => [r.name, r.value, null, null])}
        />
      </Panel>
      <Panel
        title="District supply and logistics assessment"
        note="The planner estimates district-wide exportable surplus and identifies reference exit routes. These are assessment inputs, not documented export deliveries, certified readiness or measured travel distances. A selected crop must be named in the district profile; the surplus remains district-wide and is not allocated to that crop."
      >
        <DataTable
          label="district planner supply estimates"
          columns={[
            "District",
            "Profile crops",
            "Estimated district exportable supply (tonnes)",
            "Modelled market surplus (tonnes)",
            "Reference exit hub",
            "Modelled distance (km)",
            "Evidence",
          ]}
          rows={modelSupply.map((r) => [
            r.district,
            (r.profile_crops || []).join(", "),
            r.estimated_supply,
            r.modelled_surplus,
            r.reference_exit_hub,
            r.modelled_distance_km,
            r.evidence,
          ])}
        />
      </Panel>
      <Panel
        title="Export Quality and Market Requirements"
        note="Official reference guidance is separate from measured compliance. Requirements depend on the product, product form and destination; confirm the current procedure before planning a shipment."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "NAEB export requirements",
              href: "https://www.naeb.gov.rw/export-requirements",
              text: "Commodity guidance for licensing, quality and certification.",
            },
            {
              title: "Rwanda Trade Information Portal",
              href: "https://rwandatrade.rw/objective/search?embed=true&filter_tab=1&flt_1=1&flt_2=8&includeSearch=true&l=en",
              text: "Explore official product-specific export procedures and documentation.",
            },
            {
              title: "RICA sanitary & phytosanitary services",
              href: "https://www.rica.gov.rw/seed-certification-sanitary-and-phytosanitary-services",
              text: "Plant-health inspection, certification and market-access services.",
            },
          ].map((l) => (
            <a
              key={l.title}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-cyan-100 p-4 text-sm hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <h3 className="font-bold text-cyan-900 underline">{l.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{l.text}</p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Assess product grading, traceability, packaging and handling,
          applicable licences, phytosanitary documentation and
          destination-specific certification. These links do not certify any
          listed district, crop or facility.
        </p>
      </Panel>
      <Panel
        title="Export Infrastructure and Support Facilities"
        note="Only an explicitly documented export role qualifies a registry entry as export support. Other warehouses and processing plants remain general agricultural infrastructure. Registry entries are undated context, not seasonal capacity."
      >
        <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input
            className="h-5 w-5"
            type="checkbox"
            checked={inventory}
            onChange={(e) => setInventory(e.target.checked)}
          />
          Include undated registry context
        </label>
        <p className="mb-3 text-sm text-slate-600">
          {exportFacilities.length} entries have an explicit export role;{" "}
          {registry.length} general agricultural entries match the geography,
          crop linkage and facility type.
        </p>
        <FacilityDirectory facilities={exportFacilities} />
        <details className="mt-4">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-cyan-900">
            Explore general agricultural facilities (export role not
            established)
          </summary>
          <FacilityDirectory
            facilities={registry.filter((f) => !f.export_role)}
          />
        </details>
      </Panel>
      <Panel
        title="Potential Export Opportunities"
        note="These are patterns for investigation. Increasing production does not establish international demand, available buyers, profitability, market access or export readiness."
      >
        <DataTable
          label="potential export assessment"
          columns={[
            "Crop",
            "Production (tonnes)",
            "Comparison production (tonnes)",
            "Production change (%)",
            "Classification",
            "Missing information",
          ]}
          rows={crops.map((r) => {
            const change = percentDifference(r.value, beforeCrops.get(r.name));
            return [
              r.name,
              r.value,
              beforeCrops.get(r.name) ?? null,
              change,
              change !== null && change > 0
                ? "Potential opportunity for assessment"
                : "Insufficient evidence",
              "Verify actual export participation, demand, prices, quality compliance, compatible infrastructure and logistics.",
            ];
          })}
        />
      </Panel>
      <Panel
        title="Seasonal dataset coverage"
        note="This audit lists the actual crop records and planner scenario profiles available for each agricultural season. Missing periods are retained. Production totals are not substituted for export supply or trade measurements."
      >
        <DataTable
          label="seasonal export dataset coverage"
          columns={[
            "Season",
            "Recorded crops",
            "Districts with production",
            "Production records",
            "Production (tonnes)",
            "Trade scenario profiles",
          ]}
          rows={coverage}
        />
      </Panel>
      <Panel
        id="export-downloads"
        title="Data and Download Center"
        note="CSV files retain agricultural reporting periods and evidence labels. Unavailable export measurements are blank."
      >
        <div className="flex flex-wrap gap-3">
          <CsvButton
            name="all-season-production-sources.csv"
            columns={[
              "Season",
              "District",
              "Province",
              "Crop",
              "Production (tonnes)",
              "Cultivated area (ha)",
              "Source",
              "Dataset",
              "Quality status",
            ]}
            rows={allSourceRows.map((r) => [
              r.season_code,
              r.district,
              r.province,
              r.crop,
              r.production,
              r.area,
              r.source_name,
              r.dataset_name,
              r.quality_status,
            ])}
            label="Download all-season production source records"
          />
          <CsvButton
            name={"planner-trade-scenarios-" + season + ".csv"}
            columns={[
              "Season",
              "Commodity",
              "HS code",
              "Modelled quantity (tonnes)",
              "Modelled value (USD)",
              "Evidence",
              "Reference markets",
            ]}
            rows={scenarios.map((r) => [
              r.season_code,
              r.crop,
              r.hs_code,
              r.quantity,
              r.value,
              r.evidence,
              (r.reference_destinations || []).join("; "),
            ])}
            label="Download planner trade profiles"
          />
          <CsvButton
            name={"district-supply-estimates-" + season + ".csv"}
            columns={[
              "Season",
              "District",
              "Estimated district-wide supply (tonnes)",
              "Evidence",
            ]}
            rows={modelSupply.map((r) => [
              r.season_code,
              r.district,
              r.estimated_supply,
              r.evidence,
            ])}
            label="Download district supply estimates"
          />
          <CsvButton
            name={"all-crops-export-evidence-" + season + ".csv"}
            columns={["Season", ...columns]}
            rows={cropRows.map((r) => [season, ...r])}
            label="Download crop and export evidence"
          />
          <CsvButton
            name={"district-export-context-" + season + ".csv"}
            columns={[
              "Season",
              "District",
              "Crop production (tonnes)",
              "Actual export quantity",
              "Actual export value",
              "Evidence",
            ]}
            rows={districts.map((r) => [
              season,
              r.name,
              r.value,
              null,
              null,
              "PRODUCTION_ONLY",
            ])}
            label="Download district statistics"
          />
          <CsvButton
            name="export-seasonal-comparison.csv"
            columns={["Season", "Indicator", "Value", "Unit", "Evidence"]}
            rows={trends.map((r) => [
              r.name,
              metric.label,
              r.value,
              metric.unit,
              scenarioMode
                ? "MODELLED_BASELINE"
                : indicator === "production"
                  ? "CROP_STATISTICS"
                  : "NO_VERIFIED_EXPORT_RECORDS",
            ])}
            label="Download seasonal comparison"
          />
          <CsvButton
            name="export-support-registry.csv"
            columns={facilityColumns}
            rows={facilityCsv(exportFacilities)}
            label="Download export-support register"
          />
          <CsvButton
            name="export-destinations.csv"
            columns={[
              "Destination",
              "Commodity",
              "Quantity (tonnes)",
              "Value",
              "Currency",
              "Reporting period",
            ]}
            rows={[]}
            label="Download destination register"
          />
          <ChartExport
            available={ranking.some((r) => r.value !== null)}
            id="export-ranking-chart"
            name={"export-ranking-" + season}
          />
        </div>
      </Panel>
      <Panel
        id="export-sources"
        title="Sources, periods and evidence definitions"
      >
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {Object.entries(data.methodology).map(([key, value]) => (
            <p key={key}>
              <strong className="capitalize text-slate-800">{key}: </strong>
              {value}
            </p>
          ))}
          <p>
            Production: crop_statistics, linked to crops, seasons and district
            administrative units. Trade scenario: trade_season_statistics.
            Modelled district surplus: district_export_supply_statistics.
            Facility context: agri_facilities. No source-linked actual shipment
            or destination records were identified.
          </p>
        </div>
      </Panel>
    </div>
  );
}

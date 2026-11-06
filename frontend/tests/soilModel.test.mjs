import test from "node:test";
import assert from "node:assert/strict";
import {
  soilNumber,
  soilProtocol,
  soilCatalog,
  soilDistrictResults,
  canOrderSoil,
  soilChange,
  soilMedian,
  selectedSoilObservations,
} from "../src/features/public-portal/soilModel.ts";
const scope = {
  district: "ALL",
  province: "ALL",
  source: "observations",
  indicator: "SOIL_PH",
  category: "ALL",
  protocol: "ALL",
};
const observation = (overrides = {}) => ({
  id: "o1",
  district: "Nyabihu",
  province: "Western Province",
  season_code: "2025A",
  year: 2025,
  indicator: "SOIL_PH",
  indicator_name: "Soil pH",
  value: 5.2,
  category: null,
  unit: "pH",
  depth: 20,
  method: "Water extraction",
  site_key: "site-1",
  observed_at: "2025-03-15",
  geographic_resolution: "DISTRICT",
  ...overrides,
});
const summary = {
  id: "s1",
  district: "Nyabihu",
  province: "Western Province",
  season_code: "2025A",
  year: 2025,
  cultivated: 1000,
  properties: {
    SOIL_PH: 5.8,
    ACIDITY_STATUS: "STORED_ACIDITY_CLASS",
    NITROGEN_RATING: "LOW",
    CEC_UNSPECIFIED: 20,
  },
  practices: { erosion_control_ha: 1200 },
  sources: ["Stored fixture citation"],
};
const payload = {
  observations: [
    observation(),
    observation({
      id: "o2",
      district: "Huye",
      province: "Southern Province",
      value: 6.2,
      site_key: "site-2",
    }),
    observation({
      id: "o3",
      season_code: "2024A",
      year: 2024,
      value: 5,
      observed_at: "2024-03-15",
    }),
    observation({
      id: "n1",
      indicator: "TOTAL_NITROGEN",
      indicator_name: "Soil nitrogen",
      value: 0.28,
      unit: "%",
      method: "Kjeldahl",
    }),
  ],
  summaries: [summary],
  production: [],
  methodology: {},
};
const result = (records, period = "2025A") =>
  soilDistrictResults(
    { ...payload, observations: records },
    { ...scope, district: "Nyabihu" },
    period,
  )[0];

test("soil normalization retains real zero and never supplies a default pH", () => {
  for (const v of [null, undefined, "", " ", false, -1, "invalid", Infinity])
    assert.equal(soilNumber(v), null);
  assert.equal(soilNumber("0"), 0);
  assert.equal(soilNumber("5.2"), 5.2);
});
test("soil district, period and property filters intersect", () => {
  const records = selectedSoilObservations(
    payload,
    { ...scope, district: "Nyabihu" },
    "2025A",
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].value, 5.2);
  assert.equal(
    selectedSoilObservations(
      payload,
      { ...scope, district: "Nyabihu", province: "Southern Province" },
      "2025A",
    ).length,
    0,
  );
  assert.equal(soilDistrictResults(payload, scope, "2026C").length, 0);
});
test("comparable observation medians show their supporting count", () => {
  const r = result([
    observation(),
    observation({ id: "o4", value: 5.6, site_key: "site-3" }),
  ]);
  assert.equal(r.value, 5.4);
  assert.equal(r.count, 2);
  assert.equal(r.source, "RECORDED_OBSERVATIONS");
  assert.equal(soilMedian([6, 2, 4]), 4);
  assert.equal(soilMedian([]), null);
});
test("mixed methods and missing depths prevent unsupported medians and rankings", () => {
  const mixed = {
    ...payload,
    observations: [
      observation(),
      observation({ id: "o2", district: "Huye", method: "Salt extraction" }),
    ],
  };
  assert.equal(canOrderSoil(mixed, scope, "2025A"), false);
  assert.equal(
    result([
      observation(),
      observation({ id: "o2", method: "Salt extraction" }),
    ]).value,
    null,
  );
  assert.equal(result([observation({ depth: null })]).value, null);
  const exact = soilProtocol(observation());
  assert.equal(
    selectedSoilObservations(mixed, { ...scope, protocol: exact }, "2025A")
      .length,
    1,
  );
});
test("district summary rows never become additional laboratory observations", () => {
  const r = soilDistrictResults(
    payload,
    { ...scope, source: "summaries" },
    "2025A",
  )[0];
  assert.equal(r.value, 5.8);
  assert.equal(r.count, null);
  assert.equal(r.records.length, 0);
  assert.equal(r.source, "MODELLED_DISTRICT_PROFILE");
  assert.equal(
    canOrderSoil(payload, { ...scope, source: "summaries" }, "2025A"),
    false,
  );
  assert.equal(soilChange(r, r).change, null);
});
test("nutrient ratings stay categorical and do not become concentrations", () => {
  const r = soilDistrictResults(
    payload,
    { ...scope, source: "summaries", indicator: "NITROGEN_RATING" },
    "2025A",
  )[0];
  assert.equal(r.category, "LOW");
  assert.equal(r.value, null);
  assert.ok(
    soilCatalog(payload, "observations").some(
      (r) => r.code === "TOTAL_NITROGEN" && r.unit === "%",
    ),
  );
  assert.ok(
    soilCatalog(payload, "summaries").some(
      (r) => r.code === "NITROGEN_RATING" && r.kind === "category",
    ),
  );
  assert.equal(
    soilCatalog(payload, "summaries").find((r) => r.code === "CEC_UNSPECIFIED")
      .documentedUnit,
    false,
  );
});
test("numeric observations do not receive invented deficiency classifications", () => {
  assert.equal(result([observation({ value: 4.5 })]).category, null);
  const category = soilDistrictResults(
    payload,
    {
      ...scope,
      source: "summaries",
      indicator: "ACIDITY_STATUS",
      category: "STORED_ACIDITY_CLASS",
    },
    "2025A",
  );
  assert.equal(category.length, 1);
  assert.equal(category[0].category, "STORED_ACIDITY_CLASS");
});
test("a change is available only for matching site, protocol, property and distinct dates", () => {
  const a = result([observation()]),
    b = result(
      [
        observation({
          id: "b",
          season_code: "2024A",
          year: 2024,
          value: 5,
          observed_at: "2024-03-15",
        }),
      ],
      "2024A",
    );
  const delta = soilChange(a, b);
  assert.ok(Math.abs(delta.change - 0.2) < 1e-10);
  assert.equal(delta.matched, 1);
  assert.equal(delta.pairs[0].previous, 5);
});
test("copied dates, changed depths, unknown sites and different methods do not imply change", () => {
  const a = result([observation()]);
  for (const overrides of [
    { observed_at: "2025-03-15" },
    { depth: 40 },
    { site_key: "different-site" },
    { method: "Salt extraction" },
    { unit: "other unit" },
    { site_key: null },
  ]) {
    const b = result(
      [
        observation({
          id: "b",
          season_code: "2024A",
          year: 2024,
          value: 5,
          observed_at: "2024-03-15",
          ...overrides,
        }),
      ],
      "2024A",
    );
    assert.equal(soilChange(a, b).change, null);
  }
});
test("unmatched sites do not alter a supported paired-site comparison", () => {
  const a = result([
    observation(),
    observation({ id: "extra", site_key: "unmatched", value: 9 }),
  ]);
  const b = result(
    [
      observation({
        id: "b",
        season_code: "2024A",
        year: 2024,
        value: 5,
        observed_at: "2024-03-15",
      }),
    ],
    "2024A",
  );
  const delta = soilChange(a, b);
  assert.equal(delta.matched, 1);
  assert.ok(Math.abs(delta.change - 0.2) < 1e-10);
});
test("ambiguous duplicate site records do not generate a change estimate", () => {
  const a = result([
    observation(),
    observation({ id: "duplicate", value: 5.6 }),
  ]);
  const b = result(
    [
      observation({
        season_code: "2024A",
        year: 2024,
        value: 5,
        observed_at: "2024-03-15",
      }),
    ],
    "2024A",
  );
  assert.equal(soilChange(a, b).change, null);
});

test("ambiguous laboratory alternatives are not a documented comparable protocol", () => {
  const row = observation({ method: "Bray-2 / Mehlich-3 extraction" });
  assert.equal(soilProtocol(row), null);
  assert.equal(
    canOrderSoil({ ...payload, observations: [row] }, scope, "2025A"),
    false,
  );
});
test("unit metadata stays with each period and SI case is not silently normalized", () => {
  const current = observation({ unit: "mg/kg" }),
    older = observation({
      id: "older",
      unit: "Mg/kg",
      season_code: "2024A",
      year: 2024,
      observed_at: "2024-03-15",
    });
  assert.notEqual(soilProtocol(current), soilProtocol(older));
  assert.equal(result([current]).unit, "mg/kg");
  assert.equal(result([older], "2024A").unit, "Mg/kg");
  assert.equal(
    soilChange(result([current]), result([older], "2024A")).change,
    null,
  );
});

test("paired changes are not pooled across incompatible concentration units", () => {
  const rows = [
    observation({ id: "a1", unit: "%", site_key: "site-a", value: 0.2 }),
    observation({ id: "a2", unit: "mg/kg", site_key: "site-b", value: 2000 }),
    observation({
      id: "b1",
      unit: "%",
      site_key: "site-a",
      value: 0.1,
      season_code: "2024A",
      year: 2024,
      observed_at: "2024-03-15",
    }),
    observation({
      id: "b2",
      unit: "mg/kg",
      site_key: "site-b",
      value: 1000,
      season_code: "2024A",
      year: 2024,
      observed_at: "2024-03-15",
    }),
  ];
  assert.equal(soilChange(result(rows), result(rows, "2024A")).change, null);
});

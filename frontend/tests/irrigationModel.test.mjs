import test from "node:test";
import assert from "node:assert/strict";
import {
  irrigationNumber,
  irrigationObservations,
  summarizeIrrigation,
  irrigationDistricts,
  irrigationChange,
  coverageChange,
  irrigationMethods,
  seasonalSchemeCount,
} from "../src/features/public-portal/irrigationModel.ts";
import { publicCsv } from "../src/features/public-portal/publicDownloads.ts";
const row = (district, season_code, irrigated, cultivated = 1000) => ({
  district,
  province: district === "Nyabihu" ? "Western Province" : "Southern Province",
  season_code,
  year: Number(season_code.slice(0, 4)),
  irrigated,
  cultivated,
  modern: irrigated === null ? null : irrigated * 0.75,
  traditional: irrigated === null ? null : irrigated * 0.25,
  evidence: "MODELLED",
  methods: { sprinkler_pct: 25, surface_canal_pct: 75 },
  source_reference: "Test fixture",
});
const scope = {
  province: "ALL",
  district: "ALL",
  crop: "ALL",
  category: "ALL",
};
const payload = {
  records: [
    row("Nyabihu", "2025A", 200),
    row("Huye", "2025A", 0, 2000),
    row("Nyabihu", "2024A", 100),
  ],
  production: [
    {
      district: "Nyabihu",
      province: "Western Province",
      crop: "Maize",
      season_code: "2025A",
      year: 2025,
      irrigated: 20,
      area: 200,
      production: 500,
      harvested: 180,
    },
    {
      district: "Nyabihu",
      province: "Western Province",
      crop: "Beans",
      season_code: "2025A",
      year: 2025,
      irrigated: null,
      area: 100,
      production: 60,
      harvested: 80,
    },
  ],
  schemes: [
    {
      id: "asset-1",
      name: "Fixture",
      district: "Nyabihu",
      province: "Western Province",
    },
  ],
  schemeSeasons: [],
  methodology: {},
};

test("normalization preserves missing measurements and genuine zeroes", () => {
  for (const value of [
    null,
    undefined,
    "",
    "  ",
    false,
    -1,
    "invalid",
    Infinity,
  ])
    assert.equal(irrigationNumber(value), null);
  assert.equal(irrigationNumber("0"), 0);
  assert.equal(irrigationNumber("12.5"), 12.5);
});
test("Nyabihu 2025A filters never include national or comparison-season totals", () => {
  const current = irrigationObservations(
    payload,
    { ...scope, district: "Nyabihu" },
    "2025A",
  );
  assert.equal(current.length, 1);
  assert.equal(summarizeIrrigation(current).irrigated, 200);
  assert.deepEqual(
    irrigationDistricts(current).map((r) => r.name),
    ["Nyabihu"],
  );
  assert.equal(
    irrigationObservations(
      payload,
      { ...scope, district: "Nyabihu", province: "Southern Province" },
      "2025A",
    ).length,
    0,
  );
});
test("coverage is area-weighted, rather than the average district percentage", () => {
  const sum = summarizeIrrigation(
    irrigationObservations(payload, scope, "2025A"),
  );
  assert.equal(sum.coverage, (200 / 3000) * 100);
  assert.equal(sum.districts, 2);
  assert.equal(sum.nonIrrigated, 2800);
  assert.equal(sum.modelled, 2);
});
test("missing and incompatible measurements are excluded from coverage and land-balance pairs", () => {
  const sum = summarizeIrrigation([
    row("Nyabihu", "2025A", 200, 1000),
    row("Huye", "2025A", 500, null),
    row("Nyanza", "2025A", null, 300),
    row("Huye", "2025A", 200, 100),
  ]);
  assert.equal(sum.irrigated, 900);
  assert.equal(sum.pairedIrrigated, 200);
  assert.equal(sum.coverage, 20);
  assert.equal(sum.nonIrrigated, 800);
  assert.equal(sum.incompatible, 1);
  assert.equal(sum.partial, true);
  assert.equal(
    summarizeIrrigation([row("Huye", "2025A", 200, 100)]).coverage,
    null,
  );
});
test("zero irrigation stays zero; empty periods do not become zero", () => {
  assert.equal(summarizeIrrigation([row("Huye", "2025A", 0)]).coverage, 0);
  assert.equal(summarizeIrrigation([]).irrigated, null);
  assert.equal(summarizeIrrigation([]).districts, null);
  assert.equal(
    summarizeIrrigation([row("Huye", "2025A", null)]).irrigated,
    null,
  );
  assert.equal(
    summarizeIrrigation([row("Huye", "2025A", 0, 0)]).coverage,
    null,
  );
});
test("category selection changes the numerator and never labels other irrigation as non-irrigated", () => {
  const rows = irrigationObservations(
    payload,
    { ...scope, district: "Nyabihu", category: "modern" },
    "2025A",
  );
  assert.equal(rows[0].irrigated, 150);
  assert.equal(rows[0].cultivated, 1000);
  assert.equal(summarizeIrrigation(rows, "modern").coverage, 15);
  assert.equal(summarizeIrrigation(rows, "modern").nonIrrigated, null);
});
test("crop irrigation uses the crop measurement and does not borrow district estimates", () => {
  const maize = irrigationObservations(
    payload,
    { ...scope, crop: "Maize" },
    "2025A",
  );
  assert.equal(maize[0].irrigated, 20);
  assert.equal(maize[0].cultivated, 200);
  assert.equal(summarizeIrrigation(maize).coverage, 10);
  assert.equal(
    irrigationObservations(payload, { ...scope, crop: "Beans" }, "2025A")[0]
      .irrigated,
    null,
  );
  assert.deepEqual(
    irrigationObservations(
      payload,
      { ...scope, crop: "Maize", category: "modern" },
      "2025A",
    ),
    [],
  );
});
test("coverage changes distinguish percentage points from relative percentages", () => {
  assert.equal(coverageChange(20, 10), 10);
  assert.equal(irrigationChange(20, 10), 100);
  assert.equal(coverageChange(10, 0), 10);
  assert.equal(irrigationChange(10, 0), null);
  assert.equal(irrigationChange(0, 100), -100);
  assert.equal(coverageChange(null, 10), null);
});
test("method categories come only from valid stored percentage keys and are not renormalized", () => {
  const methods = irrigationMethods([
    {
      ...row("Nyabihu", "2025A", 200),
      methods: {
        sprinkler_pct: 20,
        drip_irrigation_pct: 0,
        invalid_pct: 120,
        command_area_ha: 40,
      },
    },
  ]);
  assert.equal(methods.incomplete, 1);
  assert.deepEqual(
    methods.methods.map((r) => [r.name, r.minimum]),
    [
      ["sprinkler", 20],
      ["drip irrigation", 0],
    ],
  );
});
test("scheme counts require explicit temporal links, not the geographic inventory", () => {
  assert.equal(seasonalSchemeCount(payload, scope, "2025A"), null);
  const linked = {
    ...payload,
    schemeSeasons: [
      { id: "asset-1", season_code: "2025A" },
      { id: "asset-1", season_code: "2025A" },
    ],
  };
  assert.equal(seasonalSchemeCount(linked, scope, "2025A"), 1);
  assert.equal(
    seasonalSchemeCount(linked, { ...scope, district: "Huye" }, "2025A"),
    null,
  );
  assert.equal(
    seasonalSchemeCount(linked, { ...scope, crop: "Maize" }, "2025A"),
    null,
  );
  assert.equal(seasonalSchemeCount(linked, scope, "2024A"), null);
});
test("CSV exports preserve blanks, zeroes, commas, quotes, and neutralize formula text", () => {
  const csv = publicCsv([
    ["District", "Value"],
    ["Nyabihu", 0],
    ["Huye", null],
    ['A,"B"', " =1+1"],
  ]);
  assert.ok(csv.includes('"Nyabihu","0"'));
  assert.ok(csv.includes('"Huye",""'));
  assert.ok(csv.includes('"A,""B"""'));
  assert.ok(csv.includes('"\' =1+1"'));
});

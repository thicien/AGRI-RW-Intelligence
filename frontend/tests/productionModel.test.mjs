import test from "node:test";
import assert from "node:assert/strict";
import {
  numeric,
  selectRecords,
  summarize,
  groupRecords,
  percentChange,
} from "../src/features/public-portal/productionModel.ts";
const rows = [
  {
    season_code: "2025A",
    year: 2025,
    district: "Nyabihu",
    province: "Western Province",
    crop: "Maize",
    production: 100,
    area: 60,
    harvested: 50,
  },
  {
    season_code: "2025A",
    year: 2025,
    district: "Nyabihu",
    province: "Western Province",
    crop: "Beans",
    production: 0,
    area: 5,
    harvested: 5,
  },
  {
    season_code: "2025A",
    year: 2025,
    district: "Nyabihu",
    province: "Western Province",
    crop: "Potatoes",
    production: null,
    area: 10,
    harvested: null,
  },
  {
    season_code: "2025A",
    year: 2025,
    district: "Huye",
    province: "Southern Province",
    crop: "Maize",
    production: 900,
    area: 100,
    harvested: 100,
  },
  {
    season_code: "2024A",
    year: 2024,
    district: "Nyabihu",
    province: "Western Province",
    crop: "Maize",
    production: 80,
    area: 60,
    harvested: 40,
  },
];
const all = { province: "ALL", district: "ALL", crop: "ALL" };
test("Nyabihu 2025A never includes another district or season", () => {
  const selected = selectRecords(
    rows,
    { ...all, district: "Nyabihu" },
    "2025A",
  );
  assert.equal(selected.length, 3);
  assert.equal(summarize(selected).production, 100);
  assert.deepEqual(
    groupRecords(selected, "district").map((r) => r.name),
    ["Nyabihu"],
  );
});
test("province and crop filters intersect with district and season", () => {
  assert.equal(
    selectRecords(
      rows,
      { province: "Western Province", district: "Nyabihu", crop: "Maize" },
      "2025A",
    ).length,
    1,
  );
  assert.equal(
    selectRecords(
      rows,
      { ...all, province: "Southern Province", district: "Nyabihu" },
      "2025A",
    ).length,
    0,
  );
});
test("missing values remain null and recorded zero survives normalization and ranking input", () => {
  for (const value of [null, undefined, "", "invalid", -1, Infinity])
    assert.equal(numeric(value), null);
  assert.equal(numeric("0"), 0);
  assert.equal(numeric("12.5"), 12.5);
  const grouped = groupRecords(
    selectRecords(rows, { ...all, district: "Nyabihu" }, "2025A"),
    "crop",
  );
  assert.equal(grouped.find((r) => r.name === "Beans").production, 0);
  assert.equal(grouped.find((r) => r.name === "Potatoes").production, null);
  assert.equal(summarize([]).production, null);
  assert.equal(summarize([]).crops, null);
});
test("yield uses paired production and harvested area, never unpaired totals or mean crop yields", () => {
  const summary = summarize([
    { ...rows[0], production: 100, harvested: 50 },
    { ...rows[0], production: 900, harvested: 100 },
    { ...rows[0], production: null, harvested: 300 },
    { ...rows[0], production: 500, harvested: null },
  ]);
  assert.equal(summary.production, 1500);
  assert.equal(summary.yield, 1000 / 150);
  assert.equal(summary.partial, true);
  assert.equal(summarize([{ ...rows[0], harvested: 0 }]).yield, null);
});
test("comparison uses equivalent geographic and crop scopes", () => {
  const scope = { ...all, district: "Nyabihu", crop: "Maize" };
  const current = summarize(selectRecords(rows, scope, "2025A"));
  const previous = summarize(selectRecords(rows, scope, "2024A"));
  assert.equal(percentChange(current.production, previous.production), 25);
  assert.equal(percentChange(0, 80), -100);
  assert.equal(percentChange(10, 0), null);
  assert.equal(percentChange(null, 10), null);
  assert.equal(percentChange(10, null), null);
});

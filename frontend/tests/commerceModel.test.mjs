import test from "node:test";
import assert from "node:assert/strict";
import {
  finiteNumber,
  coordinate,
  total,
  productionRows,
  storageRows,
  registryRows,
  tradeRows,
  percentDifference,
} from "../src/features/public-portal/commerceModel.ts";
const scope = {
  district: "ALL",
  province: "ALL",
  crop: "ALL",
  facilityType: "ALL",
};
const data = {
  production: [
    {
      district: "Nyabihu",
      province: "Western Province",
      season_code: "2025A",
      crop: "Beans",
      production: 25,
    },
    {
      district: "Huye",
      province: "Southern Province",
      season_code: "2025A",
      crop: "Maize",
      production: 100,
    },
    {
      district: "Nyabihu",
      province: "Western Province",
      season_code: "2024A",
      crop: "Beans",
      production: 20,
    },
  ],
  records: [
    {
      district: "Nyabihu",
      province: "Western Province",
      season_code: "2025A",
      storage: 40,
    },
  ],
  facilities: [
    {
      id: "1",
      district: "Nyabihu",
      province: "Western Province",
      facility_type: "WAREHOUSE",
      commodities: null,
    },
    {
      id: "2",
      district: "Nyabihu",
      province: "Western Province",
      facility_type: "WAREHOUSE",
      commodities: ["Beans"],
    },
  ],
  scenarios: [{ season_code: "2025A", crop: "Beans", quantity: 10 }],
};
test("missing values remain distinct from measured zero", () => {
  assert.equal(finiteNumber(null), null);
  assert.equal(finiteNumber(""), null);
  assert.equal(finiteNumber(false), null);
  assert.equal(finiteNumber(-1), null);
  assert.equal(finiteNumber("0"), 0);
  assert.equal(total([]), null);
  assert.equal(total([null, 0]), 0);
});
test("production obeys intersecting crop, district and seasonal filters", () => {
  assert.equal(
    total(
      productionRows(
        data,
        { ...scope, district: "Nyabihu", crop: "Beans" },
        "2025A",
      ).map((r) => r.production),
    ),
    25,
  );
  assert.equal(
    productionRows(
      data,
      { ...scope, district: "Nyabihu", province: "Southern Province" },
      "2025A",
    ).length,
    0,
  );
});
test("facility types cannot silently assign district production to facilities", () => {
  assert.equal(
    productionRows(data, { ...scope, facilityType: "WAREHOUSE" }, "2025A")
      .length,
    0,
  );
});
test("district-wide storage estimates are not attributed to crops or facility types", () => {
  assert.equal(storageRows(data, scope, "2025A").length, 1);
  assert.equal(
    storageRows(data, { ...scope, crop: "Beans" }, "2025A").length,
    0,
  );
  assert.equal(
    storageRows(data, { ...scope, facilityType: "WAREHOUSE" }, "2025A").length,
    0,
  );
});
test("crop-specific directory requires an explicit commodity link", () => {
  assert.deepEqual(
    registryRows(data, { ...scope, crop: "Beans" }).map((r) => r.id),
    ["2"],
  );
});
test("national modelled exports are never allocated to filtered districts or provinces", () => {
  assert.equal(tradeRows(data, scope, "2025A").length, 1);
  assert.equal(
    tradeRows(data, { ...scope, district: "Nyabihu" }, "2025A").length,
    0,
  );
  assert.equal(
    tradeRows(data, { ...scope, province: "Western Province" }, "2025A").length,
    0,
  );
});
test("percentage changes retain decreases and reject zero or missing baselines", () => {
  assert.equal(percentDifference(80, 100), -20);
  assert.equal(percentDifference(0, 100), -100);
  assert.equal(percentDifference(80, 0), null);
  assert.equal(percentDifference(null, 100), null);
});

test("facility coordinates retain southern latitudes and reject invalid ranges", () => {
  assert.equal(coordinate(-2.1584, "latitude"), -2.1584);
  assert.equal(coordinate("30.0894", "longitude"), 30.0894);
  assert.equal(coordinate(200, "longitude"), null);
  assert.equal(coordinate(null, "latitude"), null);
  assert.equal(coordinate("", "latitude"), null);
});

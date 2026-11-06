import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
test.use({ hasTouch: true });
const observation = (overrides: Record<string, unknown> = {}) => ({
  id: "sample-a",
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
  site_key: "nyabihu-site",
  observed_at: "2025-03-15",
  geographic_resolution: "DISTRICT",
  source_name: null,
  dataset_name: null,
  dataset_version: null,
  ...overrides,
});
const summary = (
  district: string,
  overrides: Record<string, unknown> = {},
) => ({
  id: "summary-" + district,
  district,
  province:
    district === "Nyabihu"
      ? "Western Province"
      : district === "Huye"
        ? "Southern Province"
        : "City of Kigali",
  season_code: "2025A",
  year: 2025,
  cultivated: 1000,
  properties: {
    SOIL_PH: 5.8,
    ORGANIC_CARBON: 3.5,
    CEC_UNSPECIFIED: 20,
    ACIDITY_STATUS: "STORED_ACIDITY_CLASS",
    NITROGEN_RATING: district === "Nyabihu" ? "LOW" : "MODERATE",
  },
  practices: {
    erosion_control_ha: 1200,
    organic_fertilizer_ha: 200,
    organic_farmer_pct: 25,
  },
  sources: ["Synthetic summary citation"],
  ...overrides,
});
const fixture = {
  observations: [
    observation(),
    observation({
      id: "h1",
      district: "Huye",
      province: "Southern Province",
      value: 6.2,
      site_key: "huye-site",
    }),
    observation({
      id: "a0",
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
    observation({
      id: "c1",
      indicator: "ORGANIC_CARBON",
      indicator_name: "Soil organic carbon",
      value: 3.4,
      unit: "%",
      method: "Wet oxidation",
    }),
  ],
  summaries: [
    summary("Nyabihu"),
    summary("Huye"),
    summary("Gasabo"),
    summary("Nyabihu", { id: "old-summary", season_code: "2024A", year: 2024 }),
  ],
  production: ["Nyabihu", "Huye"].map((district) => ({
    district,
    province: district === "Nyabihu" ? "Western Province" : "Southern Province",
    season_code: "2025A",
    year: 2025,
    crop: "Maize",
    production: 1000,
    area: 100,
    harvested: 80,
  })),
  methodology: {
    coverage: "Represented soil sampling hectares are not recorded.",
    comparison:
      "Matching sites, methods, depths, units and separate dates are required.",
  },
};
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) => {
    const u = new URL(r.request().url());
    return u.hostname === "127.0.0.1" || u.pathname.includes("/api/v1/")
      ? r.continue()
      : r.abort();
  });
  await page.route("**/api/v1/**", (r) =>
    r.fulfill(
      r.request().url().includes("soil-fertility/public-explorer")
        ? { json: fixture }
        : { status: 503, json: { message: "Isolated soil browser check" } },
    ),
  );
});
async function nyabihu(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Soil district", { exact: true })
    .selectOption("Nyabihu");
}

test("soil filters preserve scope and display actual sampling support", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await nyabihu(page);
  const overview = page.locator('section[aria-labelledby="soil-overview"]');
  await expect(overview.getByRole("heading")).toHaveText(
    "Nyabihu District soil and fertility overview",
  );
  await expect(
    overview
      .getByText("Documented soil sampling area", { exact: true })
      .locator(".."),
  ).toContainText("Not available");
  await expect(
    overview.getByText("Soil observation rows", { exact: true }).locator(".."),
  ).toContainText("1");
  const table = page.getByRole("table", {
    name: "District soil values and supporting observations",
  });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("5.2");
  await expect(table).not.toContainText("Huye");
  await expect(
    page.getByRole("table", {
      name: "Individual soil observations and methods",
    }),
  ).toContainText("Water extraction");
  await expect(
    page.getByRole("table", {
      name: "Individual soil observations and methods",
    }),
  ).toContainText("2025-03-15");
  await expect(page).toHaveURL(/district=Nyabihu/);
});

test("soil trends use paired sites and do not connect incompatible protocols", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await nyabihu(page);
  await page
    .getByLabel("Soil comparison period", { exact: true })
    .selectOption("2024A");
  const trends = page.locator('section[aria-labelledby="soil-trends"]');
  await expect(trends).toContainText(
    "1 matched site(s) support this comparison.",
  );
  await expect(trends).toContainText("Median paired-site difference: 0.2 pH");
  expect(await trends.locator(".recharts-line-curve").count()).toBe(1);
  const changed = structuredClone(fixture);
  changed.observations.find((r) => r.id === "a0")!.method =
    "Different extraction";
  await page.route("**/soil-fertility/public-explorer", (r) =>
    r.fulfill({ json: changed }),
  );
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await page
    .getByLabel("Soil comparison period", { exact: true })
    .selectOption("2024A");
  await expect(trends).toContainText("No supported soil-change estimate");
  await expect(trends.locator(".recharts-line-curve")).toHaveCount(0);
});

test("soil summaries and nutrient ratings are not represented as lab measurements", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await page
    .getByLabel("Soil evidence source", { exact: true })
    .selectOption("summaries");
  const overview = page.locator('section[aria-labelledby="soil-overview"]');
  await expect(
    overview.getByText("Soil observation rows", { exact: true }).locator(".."),
  ).toContainText("Not available");
  await expect(
    page.locator('section[aria-labelledby="soil-rankings"]'),
  ).toContainText("Comparable rankings are unavailable");
  await page
    .getByLabel("Soil indicator", { exact: true })
    .selectOption("NITROGEN_RATING");
  await page
    .getByLabel("Soil recorded classification", { exact: true })
    .selectOption("LOW");
  const table = page.getByRole("table", {
    name: "District soil values and supporting observations",
  });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("LOW");
  await expect(table).toContainText("Not linked");
  await expect(
    page.locator(
      'section[aria-labelledby="soil-map"] path[aria-label="Nyabihu: LOW"]',
    ),
  ).toHaveCount(1);
});

test("soil No Data map districts do not receive a fallback pH", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  const map = page.locator('section[aria-labelledby="soil-map"]');
  const missing = map.locator('path[aria-label="Gasabo: No Data"]').first();
  await missing.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Soil district", { exact: true })).toHaveValue(
    "Gasabo",
  );
  await expect(page.getByRole("status")).toContainText(
    "No compatible soil values match",
  );
  await expect(
    page
      .getByRole("table", {
        name: "District soil values and supporting observations",
      })
      .locator("tbody tr"),
  ).toHaveCount(0);
});

test("soil practices retain reporting units and flag incompatible area denominators", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await nyabihu(page);
  const table = page.getByRole("table", {
    name: "Reported soil management practices by district",
  });
  await expect(table).toContainText("Coverage is not calculated");
  await expect(table).toContainText("1,200");
  await page
    .getByLabel("Soil management practice", { exact: true })
    .selectOption("organic_farmer_pct");
  await expect(table).toContainText("% of farmers");
  await expect(table).toContainText("25");
  await expect(
    page.locator('section[aria-labelledby="soil-constraints"]'),
  ).toContainText("no fertilizer or lime dosage prescriptions");
});

test("soil CSV includes only the selected observation and its sampling metadata", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await nyabihu(page);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Filtered soil CSV", exact: true })
    .click();
  const file = await pending;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain('"2025A","Nyabihu","Western Province","SOIL_PH","5.2"');
  expect(csv).toContain('"2025-03-15","20","Water extraction"');
  expect(csv).not.toContain("Huye");
  expect(csv).not.toContain("2024A");
  expect(csv).not.toContain("TOTAL_NITROGEN");
});

test("soil explorer fits phone, tablet and laptop widths and routes source/export controls", async ({
  page,
}) => {
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  for (const width of [320, 390, 768, 1024, 1280, 1366, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
      "soil at " + width,
    ).toBeLessThanOrEqual(2);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Data Sources & Provenance" }).click();
  await expect(page.locator("#soil-sources")).toBeInViewport();
  await page
    .getByRole("button", {
      name: "Download Research Summary (CSV)",
      exact: true,
    })
    .click();
  await expect(page.locator("#soil-downloads")).toBeInViewport();
});

test("soil failures retry without showing invented values", async ({
  page,
}) => {
  let count = 0;
  await page.route("**/soil-fertility/public-explorer", (r) => {
    count++;
    return r.fulfill(
      count === 1
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: fixture },
    );
  });
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Soil data could not be loaded" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry soil data" }).click();
  await expect(
    page.getByRole("heading", { name: "National soil and fertility overview" }),
  ).toBeVisible();
});

test("live soil snapshot preserves the actual observation coverage and responsive map", async ({
  page,
}, testInfo) => {
  const path = "test-results/soil-live.json";
  test.skip(
    !existsSync(path),
    "Optional read-only soil snapshot is not present.",
  );
  const snapshot = JSON.parse(readFileSync(path, "utf8"));
  await page.route("**/soil-fertility/public-explorer", (r) =>
    r.fulfill({ json: snapshot }),
  );
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await expect(
    page.getByLabel("Soil evidence source", { exact: true }),
  ).toHaveValue("observations");
  await expect(page.getByLabel("Soil season", { exact: true })).toHaveValue(
    "2025A",
  );
  const n = snapshot.observations.filter(
    (r: { indicator: string; season_code: string }) =>
      r.indicator === "SOIL_PH" && r.season_code === "2025A",
  ).length;
  await expect(
    page
      .locator('section[aria-labelledby="soil-overview"]')
      .getByText("Soil observation rows", { exact: true })
      .locator(".."),
  ).toContainText(String(n));
  await expect(
    page
      .getByRole("table", {
        name: "District soil values and supporting observations",
      })
      .locator("tbody tr"),
  ).toHaveCount(8);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#soil-overview").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("soil-live-phone.png") });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page
    .locator('section[aria-labelledby="soil-map"]')
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("soil-live-map-laptop.png"),
  });
});

test("ambiguous soil laboratory methods preserve raw observations without unsupported comparisons", async ({
  page,
}) => {
  const ambiguous = structuredClone(fixture);
  ambiguous.observations.find((r) => r.id === "n1")!.method =
    "Bray-2 / Mehlich-3 extraction";
  await page.route("**/soil-fertility/public-explorer", (r) =>
    r.fulfill({ json: ambiguous }),
  );
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await page
    .getByLabel("Soil indicator", { exact: true })
    .selectOption("TOTAL_NITROGEN");
  await expect(page.getByRole("status")).toContainText(
    "Raw observations are available",
  );
  await expect(
    page.getByRole("table", {
      name: "Individual soil observations and methods",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: "Individual soil observations and methods",
    }),
  ).toContainText("0.28");
  await expect(
    page.locator('section[aria-labelledby="soil-rankings"]'),
  ).toContainText("Comparable rankings are unavailable");
});

test("soil category colours remain stable across periods and category filters", async ({
  page,
}) => {
  const classified = structuredClone(fixture);
  classified.summaries.find(
    (r) => r.id === "old-summary",
  )!.properties.NITROGEN_RATING = "MODERATE";
  await page.route("**/soil-fertility/public-explorer", (r) =>
    r.fulfill({ json: classified }),
  );
  await page.goto("/public-portal?section=soil", { waitUntil: "networkidle" });
  await page
    .getByRole("tab", { name: "Soil observations & planner context" })
    .click();
  await page
    .getByLabel("Soil evidence source", { exact: true })
    .selectOption("summaries");
  await page
    .getByLabel("Soil indicator", { exact: true })
    .selectOption("NITROGEN_RATING");
  await page
    .getByLabel("Soil comparison period", { exact: true })
    .selectOption("2024A");
  const figures = page.locator('section[aria-labelledby="soil-map"] figure');
  const current = figures.first().locator('path[aria-label="Huye: MODERATE"]');
  const baseline = figures
    .last()
    .locator('path[aria-label="Nyabihu: MODERATE"]');
  const colour = await current.getAttribute("fill");
  expect(await baseline.getAttribute("fill")).toBe(colour);
  await page
    .getByLabel("Soil recorded classification", { exact: true })
    .selectOption("MODERATE");
  expect(await current.getAttribute("fill")).toBe(colour);
});

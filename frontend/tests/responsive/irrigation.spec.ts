import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";

test.use({ hasTouch: true });
const base = (
  district: string,
  season_code: string,
  irrigated: number | null,
  cultivated: number,
) => ({
  id: district + season_code,
  district,
  province:
    district === "Nyabihu"
      ? "Western Province"
      : district === "Huye"
        ? "Southern Province"
        : "City of Kigali",
  season_code,
  year: Number(season_code.slice(0, 4)),
  irrigated,
  cultivated,
  modern: irrigated === null ? null : irrigated * 0.75,
  traditional: irrigated === null ? null : irrigated * 0.25,
  evidence: "MODELLED",
  methods: { sprinkler_pct: 25, surface_canal_pct: 75 },
  source_reference: "Explicit synthetic irrigation fixture",
});
const fixture = {
  records: [
    base("Nyabihu", "2025B", 250, 1000),
    base("Huye", "2025B", 100, 2000),
    base("Gasabo", "2025B", null, 700),
    base("Nyabihu", "2025A", 200, 1000),
    base("Huye", "2025A", 0, 2000),
    base("Gasabo", "2025A", null, 700),
    base("Nyabihu", "2024A", 100, 1000),
    base("Huye", "2024A", 100, 2000),
  ],
  production: ["2025A", "2025B", "2024A"].flatMap((season_code, i) =>
    ["Nyabihu", "Huye", "Gasabo"].flatMap((district) =>
      ["Maize", "Beans"].map((crop) => ({
        district,
        province:
          district === "Nyabihu"
            ? "Western Province"
            : district === "Huye"
              ? "Southern Province"
              : "City of Kigali",
        season_code,
        year: Number(season_code.slice(0, 4)),
        crop,
        irrigated: crop === "Maize" && district === "Nyabihu" ? 20 : null,
        area: 200,
        production: 100 * (i + 1),
        harvested: 180,
        quality_status: "UNVERIFIED",
      })),
    ),
  ),
  schemes: [
    {
      id: "scheme-1",
      name: "Synthetic Nyabihu scheme",
      district: "Nyabihu",
      province: "Western Province",
      type: "RECORDED_TYPE",
      method: "Recorded test method",
      command_area: 80,
      irrigable_area: 70,
      longitude: 29.5,
      latitude: -1.65,
      status: "RECORDED_STATUS",
      last_verified_at: null,
    },
  ],
  schemeSeasons: [{ id: "scheme-1", season_code: "2024A" }],
  methodology: {
    source: "Synthetic fixture; not real public statistics",
    coverageBasis: "Compatible irrigated / cultivated area pairs.",
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
      r.request().url().includes("/irrigation/public-explorer")
        ? { json: fixture }
        : {
            status: 503,
            json: { message: "Isolated irrigation browser check" },
          },
    ),
  );
});
async function selectNyabihu(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Irrigation agricultural year", { exact: true })
    .selectOption("2025");
  await page
    .getByLabel("Irrigation season", { exact: true })
    .selectOption("2025A");
  await page
    .getByLabel("Irrigation comparison season", { exact: true })
    .selectOption("2024A");
  await page
    .getByLabel("Irrigation district", { exact: true })
    .selectOption("Nyabihu");
}

test("irrigation filters update every section and distinguish comparison units", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/irrigation/public-explorer")) requests++;
  });
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await selectNyabihu(page);
  const overview = page.locator(
    'section[aria-labelledby="irrigation-overview"]',
  );
  await expect(overview.getByRole("heading")).toHaveText(
    "Nyabihu District irrigation overview",
  );
  await expect(
    overview.getByText("Total irrigated area", { exact: true }).locator(".."),
  ).toContainText("200");
  await expect(
    overview.getByText("Irrigation coverage", { exact: true }).locator(".."),
  ).toContainText("20");
  const rankings = page.getByRole("table", {
    name: "District irrigation rankings and seasonal changes",
  });
  await expect(rankings.locator("tbody tr")).toHaveCount(1);
  await expect(rankings).toContainText("Nyabihu");
  await expect(rankings).not.toContainText("Huye");
  await expect(
    page.locator('section[aria-labelledby="irrigation-trends"]'),
  ).toContainText("+10.00 percentage points (+100.00% relative change)");
  await expect(
    page
      .getByRole("table", {
        name: "Irrigation and production comparison by district",
      })
      .locator("tbody tr"),
  ).toHaveCount(1);
  await expect(page).toHaveURL(/district=Nyabihu/);
  expect(requests).toBe(1);
});

test("irrigation category and crop filters use only compatible measurements", async ({
  page,
}) => {
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await selectNyabihu(page);
  await page
    .getByLabel("Irrigation category", { exact: true })
    .selectOption("modern");
  const overview = page.locator(
    'section[aria-labelledby="irrigation-overview"]',
  );
  await expect(
    overview.getByText("Total irrigated area", { exact: true }).locator(".."),
  ).toContainText("150");
  const performance = page.getByRole("table", {
    name: /Irrigation performance for/,
  });
  await expect(
    performance.getByRole("row", { name: /Non-irrigated area/ }),
  ).toContainText("Not available");
  await page
    .getByLabel("Irrigation crop", { exact: true })
    .selectOption("Maize");
  await expect(
    page.getByLabel("Irrigation category", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Irrigation category", { exact: true }),
  ).toHaveValue("ALL");
  await expect(
    overview.getByText("Total irrigated area", { exact: true }).locator(".."),
  ).toContainText("20");
  await expect(
    overview.getByText("Irrigation coverage", { exact: true }).locator(".."),
  ).toContainText("10");
  await expect(
    page.locator('section[aria-labelledby="irrigation-methods"]'),
  ).toContainText("Scheme records cannot be attributed to this crop");
});

test("map separates No Data from zero and supports keyboard district selection", async ({
  page,
}) => {
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await page
    .getByLabel("Irrigation season", { exact: true })
    .selectOption("2025A");
  const map = page
    .locator('section[aria-labelledby="irrigation-map"] figure')
    .first();
  const zero = map.locator('path[aria-label^="Huye:"]'),
    missing = map.locator('path[aria-label^="Gasabo:"]');
  await expect(zero).toHaveAttribute("aria-label", "Huye: 0 ha");
  await expect(missing).toHaveAttribute("aria-label", "Gasabo: No Data");
  expect(await zero.getAttribute("fill")).not.toBe(
    await missing.getAttribute("fill"),
  );
  await missing.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByLabel("Irrigation district", { exact: true }),
  ).toHaveValue("Gasabo");
  const overview = page.locator(
    'section[aria-labelledby="irrigation-overview"]',
  );
  await expect(
    overview.getByText("Total irrigated area", { exact: true }).locator(".."),
  ).toContainText("Not available");
  await expect(page.getByRole("status")).toContainText(
    "No irrigated-area measurements match",
  );
});

test("irrigation CSV export matches district, season, and evidence filters", async ({
  page,
}) => {
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await selectNyabihu(page);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Filtered irrigation CSV", exact: true })
    .click();
  const file = await pending;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain(
    '"2025A","ALL","Nyabihu","ALL","ALL","Nyabihu","1000","200","20","800","MODELLED"',
  );
  expect(csv).not.toContain("Huye");
  expect(csv).not.toContain("2024A");
});

test("registry records are not counted as seasonal schemes without links", async ({
  page,
}) => {
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await selectNyabihu(page);
  const overview = page.locator(
    'section[aria-labelledby="irrigation-overview"]',
  );
  await expect(
    overview.getByText("Season-linked schemes", { exact: true }).locator(".."),
  ).toContainText("Not available");
  await expect(
    page.getByRole("table", {
      name: "Geographic irrigation scheme registry, not a seasonal inventory",
    }),
  ).toContainText("-1.6500, 29.5000");
  await page
    .getByLabel("Irrigation agricultural year", { exact: true })
    .selectOption("2024");
  await expect(
    overview.getByText("Season-linked schemes", { exact: true }).locator(".."),
  ).toContainText("1");
});

test("irrigation page fits phone, tablet, and laptop widths with readable tables", async ({
  page,
}) => {
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
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
      "document at " + width,
    ).toBeLessThanOrEqual(2);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const table = page.getByRole("region", {
    name: "District irrigation rankings and seasonal changes",
  });
  expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
});

test("public irrigation source and export controls target the current explorer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Data Sources & Provenance" }).click();
  await expect(page.locator("#irrigation-sources")).toBeInViewport();
  await page
    .getByRole("button", {
      name: "Download Research Summary (CSV)",
      exact: true,
    })
    .click();
  await expect(page.locator("#irrigation-downloads")).toBeInViewport();
});

test("unavailable irrigation service shows a retry state without invented values", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/irrigation/public-explorer", (r) => {
    calls++;
    return r.fulfill(
      calls === 1
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: fixture },
    );
  });
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await expect(
    page.getByRole("heading", { name: "Irrigation data could not be loaded" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry irrigation data" }).click();
  await expect(
    page.getByRole("heading", { name: "National irrigation overview" }),
  ).toBeVisible();
});

test("live irrigation snapshot preserves database figures and responsive layouts", async ({
  page,
}, testInfo) => {
  const path = "test-results/irrigation-live.json";
  test.skip(
    !existsSync(path),
    "Optional read-only database snapshot is not present.",
  );
  const snapshot = JSON.parse(readFileSync(path, "utf8"));
  await page.route("**/irrigation/public-explorer", (r) =>
    r.fulfill({ json: snapshot }),
  );
  await page.goto("/public-portal?section=irrigation", {
    waitUntil: "networkidle",
  });
  await expect(
    page.locator('section[aria-labelledby="irrigation-overview"]'),
  ).toContainText("Modelled estimates");
  for (const width of [320, 390, 768, 1024, 1280, 1366]) {
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
      "live snapshot at " + width,
    ).toBeLessThanOrEqual(2);
  }
  await page
    .getByLabel("Irrigation agricultural year", { exact: true })
    .selectOption("2025");
  await page
    .getByLabel("Irrigation season", { exact: true })
    .selectOption("2025A");
  await page
    .getByLabel("Irrigation district", { exact: true })
    .selectOption("Nyabihu");
  const actual = snapshot.records.find(
    (r: { district: string; season_code: string }) =>
      r.district === "Nyabihu" && r.season_code === "2025A",
  );
  const overview = page.locator(
    'section[aria-labelledby="irrigation-overview"]',
  );
  await expect(
    overview.getByText("Total irrigated area", { exact: true }).locator(".."),
  ).toContainText(
    Number(actual.irrigated).toLocaleString("en-GB", {
      maximumFractionDigits: 1,
    }),
  );
  await expect(
    overview.getByText("Irrigation coverage", { exact: true }).locator(".."),
  ).toContainText(
    (
      (Number(actual.irrigated) / Number(actual.cultivated)) *
      100
    ).toLocaleString("en-GB", { maximumFractionDigits: 2 }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await overview.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("irrigation-live-phone.png"),
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page
    .locator('section[aria-labelledby="irrigation-map"]')
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("irrigation-live-map-laptop.png"),
  });
});

test("switching public explorers preserves the selected district and export target", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/crop-statistics/public-production", (r) =>
    r.fulfill({
      json: {
        records: fixture.production,
        source: "Synthetic crop production fixture",
      },
    }),
  );
  await page.goto("/public-portal", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "National production overview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /02 Irrigation Intelligence/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "National irrigation overview" }),
  ).toBeVisible();
  await selectNyabihu(page);
  await page
    .getByRole("button", { name: /01 Agricultural Production/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nyabihu District production overview" }),
  ).toBeVisible();
  await expect(page.locator("#irrigation-overview")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Download Research Summary (CSV)",
      exact: true,
    })
    .click();
  await expect(page.locator("#production-downloads")).toBeInViewport();
});

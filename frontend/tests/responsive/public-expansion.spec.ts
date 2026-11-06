import { test, expect } from "@playwright/test";
const api = "http://localhost:3000/api/v1";
test.use({
  hasTouch: true,
  baseURL: process.env.LIVE_PORTAL_URL || "http://localhost:5173",
});
test("soil source tables preserve district scope, raw source evidence and missing seasons", async ({
  page,
  request,
}) => {
  const catalog = await (
    await request.get(api + "/soil-fertility/public-source-tables")
  ).json();
  expect(catalog.audit).toHaveLength(43);
  expect(catalog.periods.length).toBeGreaterThanOrEqual(38);
  const s = catalog.series.find(
    (s: any) =>
      s.season_code === "2026B" &&
      /erosion control/i.test(s.header) &&
      s.unit === "ha",
  );
  const source = await (
    await request.get(
      api + "/soil-fertility/public-source-tables?series=" + s.id,
    )
  ).json();
  expect(new Set(source.records.map((r: any) => r.district)).size).toBe(30);
  await page.goto("/public-portal?section=soil");
  await expect(
    page.getByRole("heading", {
      name: "National Soil & Fertility Overview",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Agricultural year and season", { exact: true }),
  ).toHaveValue("2026B");
  await page.getByLabel("District", { exact: true }).selectOption("Nyabihu");
  const table = page.getByRole("table", {
    name: "district soil statistics",
    exact: true,
  });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("Nyabihu");
  await expect(table).not.toContainText("Gasabo");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download filtered soil statistics",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toContain("2026B-Nyabihu");
  await page
    .getByLabel("Agricultural year and season", { exact: true })
    .selectOption(catalog.periods.find((p: string) => p.startsWith("2014")));
  await expect(
    page.getByText(
      /No structured district soil or fertility table is available/,
    ),
  ).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(0);
});
test("storage filters do not assign district estimates to a selected crop", async ({
  page,
}) => {
  await page.goto("/public-portal?section=post-harvest");
  await expect(
    page.getByRole("heading", {
      name: "National Post-Harvest Overview",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Recorded agricultural facility locations" })
      .getByRole("button")
      .first(),
  ).toBeAttached();
  await page.getByLabel("District", { exact: true }).selectOption("Nyabihu");
  const table = page.getByRole("table", {
    name: "district post-harvest performance",
    exact: true,
  });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("MODELLED_BASELINE");
  await page
    .getByLabel("Post-harvest indicator", { exact: true })
    .selectOption("processing");
  await expect(table).toContainText("tonnes/day");
  const crop = page.getByLabel("Crop or commodity", { exact: true });
  await crop.selectOption({ index: 1 });
  await expect(table.locator("tbody tr")).toHaveCount(0);
  await expect(
    page
      .getByRole("table", { name: "facility directory", exact: true })
      .locator("tbody tr"),
  ).toHaveCount(0);
});
test("export catalog includes every crop and national scenarios are not allocated to districts", async ({
  page,
  request,
}) => {
  const data = await (await request.get(api + "/trade/public-explorer")).json();
  expect(data.actualExports).toHaveLength(0);
  expect(data.destinations).toHaveLength(0);
  await page.goto("/public-portal?section=export");
  await expect(
    page.getByRole("heading", {
      name: "National Export Overview",
      exact: true,
    }),
  ).toBeVisible();
  const crops = await page
    .getByLabel("Crop or commodity", { exact: true })
    .locator("option")
    .allTextContents();
  for (const c of new Set(data.production.map((r: any) => r.crop)))
    expect(crops).toContain(c);
  await page.getByLabel("District", { exact: true }).selectOption("Nyabihu");
  await page
    .getByLabel("Export exploration indicator", { exact: true })
    .selectOption("model_quantity");
  const ranking = page.getByRole("table", {
    name: "export indicator ranking",
    exact: true,
  });
  await expect(ranking.locator("tbody tr")).toHaveCount(0);
  await page.getByLabel("District", { exact: true }).selectOption("ALL");
  await expect(ranking.locator("tbody tr")).toHaveCount(10);
  await expect(ranking).toContainText("MODELLED_BASELINE");
  await expect(
    page.getByLabel("Export destination", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "NAEB export requirements" }),
  ).toHaveAttribute("href", "https://www.naeb.gov.rw/export-requirements");
});
test("all three new explorers fit phone, tablet and laptop screens", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const section of ["soil", "post-harvest", "export"]) {
    await page.goto("/public-portal?section=" + section);
    await expect(
      page.getByRole("heading", {
        name:
          section === "soil"
            ? "National Soil & Fertility Overview"
            : section === "export"
              ? "National Export Overview"
              : "National Post-Harvest Overview",
        exact: true,
      }),
    ).toBeVisible();
    for (const width of [320, 390, 768, 1024, 1280, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(100);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        section + " at " + width,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `test-results/${section}-public-phone.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

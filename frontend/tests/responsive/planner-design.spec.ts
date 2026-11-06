import { test, expect } from "@playwright/test";
test.use({ baseURL: process.env.LIVE_PORTAL_URL || "http://localhost:5173" });
const sections = [
  ["crops", "crop-statistics"],
  ["irrigation", "irrigation"],
  ["soil-conservation", "soil-fertility"],
  ["post-harvest", "post-harvest"],
  ["imports-exports", "trade"],
];
for (const [pageName, endpoint] of sections) {
  test(
    pageName + " keeps its map, season filtering and responsive presentation",
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/admin/" + pageName);
      await expect(page.locator(".planner-page-header h1")).toBeVisible();
      const map = page.locator('[data-planner-map="preserved"]');
      await expect(map).toHaveCount(1);
      await expect(map.locator(".maplibregl-canvas")).toBeAttached({
        timeout: 20000,
      });
      const filters = page.locator(".planner-filter-panel");
      const season = filters.locator("select").first();
      await expect(season.locator("option").nth(1)).toBeAttached({
        timeout: 20000,
      });
      const current = await season.inputValue();
      const other = await season
        .locator("option")
        .evaluateAll(
          (options, current) =>
            (options as HTMLOptionElement[]).find(
              (o) => o.value && o.value !== current,
            )?.value,
          current,
        );
      expect(other).toBeTruthy();
      const updated = page.waitForResponse(
        (r) =>
          r.url().includes("/" + endpoint + "/decision-workspace") &&
          new URL(r.url()).searchParams.get("season") === other,
      );
      await season.selectOption(other!);
      expect((await updated).ok()).toBe(true);
      await expect(map.locator(".maplibregl-canvas")).toBeAttached();
      for (const width of [320, 390, 768, 1024, 1280, 1366, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(80);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          pageName + " at " + width,
        ).toBe(true);
      }
      await page.setViewportSize({ width: 1366, height: 900 });
      const zoom = map.locator(".maplibregl-ctrl-zoom-in");
      if (await zoom.count()) await zoom.click();
      await expect(map.locator(".maplibregl-canvas")).toBeAttached();
      expect(errors).toEqual([]);
    },
  );
}
test("executive dashboard connects all five planning areas and preserves its map and reporting", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "Executive dashboard", exact: true }),
  ).toBeVisible();
  const domains = page.locator("#planner-planning-areas");
  await expect(domains.locator(".planner-module-card")).toHaveCount(5);
  for (const target of [
    "/admin/crops",
    "/admin/irrigation",
    "/admin/soil-conservation",
    "/admin/post-harvest",
    "/admin/imports-exports",
  ])
    await expect(domains.locator('a[href="' + target + '"]')).toHaveCount(1);
  await page
    .getByRole("link", { name: "Five planning areas", exact: false })
    .click();
  await expect(
    domains.getByRole("heading", { name: "Five planning areas", exact: true }),
  ).toBeInViewport();
  const notes = domains.locator("details").first();
  await notes.locator("summary").click();
  await expect(notes).toHaveAttribute("open", "");
  await expect(page.locator("svg[data-planner-map]")).toHaveAttribute(
    "viewBox",
    "0 0 620 490",
  );
  for (const width of [320, 390, 768, 1024, 1280, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "executive at " + width,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page
    .getByRole("button", { name: "Export Dossier", exact: true })
    .click();
  await expect(
    page
      .getByRole("button", {
        name: /Download.*PDF|Download.*Report|Download.*CSV/,
      })
      .first(),
  ).toBeAttached({ timeout: 15000 });
  expect(errors).toEqual([]);
});
test("public portal no longer shows the removed badge or access notice", async ({
  page,
}) => {
  await page.goto("/public-portal");
  await expect(
    page.getByRole("heading", {
      name: "Public Agricultural Intelligence Portal",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Read-Only Public Portal", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/AgriLens Rwanda.*Open Public Evidence/),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View Methodology", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("banner", { name: "Public portal header" }),
  ).toBeVisible();
});

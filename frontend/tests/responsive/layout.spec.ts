import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const groups: Record<string, string[]> = {
  "/district": [
    "overview",
    "productivity",
    "irrigation",
    "soil",
    "post-harvest",
    "exports",
    "map",
    "interventions",
    "reports",
    "notifications",
    "profile",
  ],
  "/data-manager": [
    "overview",
    "datasets",
    "import-extraction",
    "validation-quality",
    "seasons-coverage",
    "processing-jobs",
    "agricultural-data",
    "spatial-data",
    "analytics-reports",
    "versions",
    "audit-logs",
    "profile",
  ],
  "/system-admin": [
    "overview",
    "users",
    "roles",
    "geography",
    "configuration",
    "health",
    "audit-logs",
    "security",
    "backup",
    "notifications",
    "reports",
    "profile",
  ],
  "/admin": [
    "dashboard",
    "crops",
    "irrigation",
    "soil-conservation",
    "post-harvest",
    "imports-exports",
    "reports",
    "profile",
  ],
};
const snapshots = existsSync("test-results/layout-fixtures.json")
  ? JSON.parse(readFileSync("test-results/layout-fixtures.json", "utf8"))
  : {};
const routes = [
  "/",
  "/login",
  ...["productivity", "irrigation", "soil", "post-harvest", "export"].map(
    (section) => `/public-portal?section=${section}`,
  ),
  ...Object.entries(groups).flatMap(([base, pages]) =>
    pages.map((page) => `${base}/${page}`),
  ),
];

// Explicit fixture: browser layout tests are independent of live services and credentials.
const productionRecords = ["2024A", "2025A", "2025B", "2025C"].flatMap(
  (season_code, i) =>
    ["Nyabihu", "Huye", "Gasabo"].flatMap((district, j) =>
      ["Maize", "Beans", "Irish Potatoes"].map((crop, k) => ({
        season_code,
        year: Number(season_code.slice(0, 4)),
        district,
        province: ["Western Province", "Southern Province", "City of Kigali"][
          j
        ],
        crop,
        production: 1000 * (i + 1) * (k + 1),
        area: 500 + j * 100,
        harvested: 400 + j * 100,
      })),
    ),
);

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" || url.pathname.includes("/api/v1/")
      ? route.continue()
      : route.abort();
  });
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (snapshots[url.pathname])
      return route.fulfill({ json: snapshots[url.pathname] });
    if (url.pathname.endsWith("/public-production"))
      return route.fulfill({
        json: {
          records: productionRecords,
          source: "Responsive test fixture",
          reportingNote: "Synthetic browser test records.",
        },
      });
    return route.fulfill({
      status: 503,
      json: { message: "Service unavailable in isolated layout tests" },
    });
  });
});

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`all pages fit ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const failures: unknown[] = [];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });
      const result = await page.evaluate(() => {
        const main = document.querySelector<HTMLElement>(".workspace-main");
        const documentOverflow =
          document.documentElement.scrollWidth - window.innerWidth;
        const mainOverflow = main ? main.scrollWidth - main.clientWidth : 0;
        const error = document.body.textContent?.includes(
          "Unexpected Application Error!",
        );
        const offenders = Array.from(
          document.querySelectorAll<HTMLElement>("main *"),
        )
          .filter((el) => {
            if (
              el.closest(
                ".responsive-table, .overflow-x-auto, [inert], .maplibregl-map",
              )
            )
              return false;
            const rect = el.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.right > window.innerWidth + 2 &&
              getComputedStyle(el).position !== "fixed"
            );
          })
          .slice(0, 5)
          .map((el) => ({
            tag: el.tagName,
            class: typeof el.className === "string" ? el.className : "",
            text: el.textContent?.slice(0, 60),
          }));
        return { documentOverflow, mainOverflow, error, offenders };
      });
      if (
        result.documentOverflow > 2 ||
        result.mainOverflow > 2 ||
        result.error
      ) {
        failures.push({ route, ...result });
        console.log(
          JSON.stringify({ width: viewport.width, route, ...result }),
        );
      }
    }
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });
}

for (const base of Object.keys(groups)) {
  test(`${base} mobile navigation is usable by touch and keyboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${base}/overview`.replace("/admin/overview", "/admin/dashboard"),
      { waitUntil: "networkidle" },
    );
    const trigger = page.getByRole("button", {
      name: "Open workspace navigation",
      exact: true,
    });
    await trigger.click();
    const sidebar = page.getByRole("dialog", { name: "Workspace navigation" });
    await expect(sidebar).toBeVisible();
    const bounds = await sidebar.boundingBox();
    expect(bounds?.x).toBe(0);
    expect(bounds!.width).toBeLessThan(390);
    await page.keyboard.press("Shift+Tab");
    expect(
      await sidebar.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await sidebar.getByRole("link").nth(1).click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page
      .getByRole("button", { name: "Close workspace navigation", exact: true })
      .click();
    await expect(trigger).toBeFocused();
  });
}

test("phone production filters, local table scrolling, and source dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/public-portal", { waitUntil: "networkidle" });
  await page.getByLabel("District", { exact: true }).selectOption("Nyabihu");
  await page
    .getByLabel("Agricultural year", { exact: true })
    .selectOption("2025");
  await page.getByLabel("Season", { exact: true }).selectOption("2025A");
  await expect(
    page.getByRole("heading", { name: "Nyabihu District production overview" }),
  ).toBeVisible();
  const table = page.locator(".responsive-table").first();
  expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await table.focus();
  await page.keyboard.press("ArrowRight");
  await page
    .getByRole("button", { name: "Toggle public portal navigation" })
    .click();
  await page.getByRole("button", { name: "Methodology & Sources" }).click();
  const dialog = page.locator(".responsive-dialog-backdrop > div").last();
  const box = await dialog.boundingBox();
  expect(box!.height).toBeLessThanOrEqual(844 - 32);
  expect(box!.width).toBeLessThanOrEqual(390 - 32);
});

test("login remains scrollable in landscape with a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/login");
  await page.getByRole("button", { name: /sign in/i }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeInViewport();
});

test.describe("Touch devices", () => {
  test.use({ hasTouch: true });

  test('touch layouts fit narrow phones', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ['/', '/public-portal', '/admin/dashboard', '/admin/crops', '/admin/irrigation', '/admin/post-harvest', '/admin/imports-exports', '/district/productivity', '/data-manager/overview', '/system-admin/users']) {
        await page.goto(route, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => {
          const main = document.querySelector<HTMLElement>('.workspace-main');
          return { document: document.documentElement.scrollWidth - window.innerWidth, main: main ? main.scrollWidth - main.clientWidth : 0 };
        });
        expect(overflow.document, route + ' document at ' + width).toBeLessThanOrEqual(2);
        expect(overflow.main, route + ' content at ' + width).toBeLessThanOrEqual(2);
      }
    }
  });


  test("phone controls provide comfortable touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/district/overview", { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", {
      name: "Open workspace navigation",
      exact: true,
    });
    const box = await trigger.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    await trigger.click();
    const link = page.getByRole("dialog").getByRole("link").first();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});

test("account form remains usable on a short phone screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto("/system-admin/users", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create Authorized Account" }).click();
  const dialog = page.locator(".responsive-dialog-backdrop > div");
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(16);
  expect(box!.height).toBeLessThanOrEqual(568 - 32);
  const submit = dialog.locator('button[type="submit"]');
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
});

test("navigation adapts when rotating or resizing the device", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", {
    name: "Open workspace navigation",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Workspace navigation" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(trigger).toBeHidden();
  await expect(page.locator("#workspace-navigation")).not.toHaveAttribute(
    "inert",
  );
  await expect(page.locator(".workspace-main")).not.toHaveAttribute("inert");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#workspace-navigation")).toHaveAttribute("inert");
});

import { test, expect } from "@playwright/test";
test.use({ baseURL: "http://localhost:5173" });
test("registry overview uses all source records rather than the seasonal count", async ({
  page,
  request,
}) => {
  const d = await (
    await request.get(
      "http://localhost:3000/api/v1/post-harvest/public-explorer",
    )
  ).json();
  expect(d.facilities.length).toBe(97);
  await page.goto("/public-portal?section=post-harvest");
  const overview = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "National Post-Harvest Overview",
        exact: true,
      }),
    });
  await expect(
    overview.getByText("Registered facilities", { exact: true }),
  ).toBeVisible();
  await expect(overview.getByText("97", { exact: true })).toBeVisible();
  await expect(
    overview.getByText("Estimated facilities", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("District", { exact: true }).selectOption("Nyabihu");
  await expect(
    overview
      .getByText(
        String(
          d.facilities.filter((f: any) => f.district === "Nyabihu").length,
        ),
        { exact: true },
      )
      .first(),
  ).toBeVisible();
});
test("header remains sticky and has direct home and login links at every width", async ({
  page,
}) => {
  await page.goto("/public-portal?section=export");
  await expect(
    page.getByRole("heading", {
      name: "National Export Overview",
      exact: true,
    }),
  ).toBeVisible();
  const h = page.getByRole("banner", { name: "Public portal header" });
  await expect(
    h.getByRole("link", { name: "Login", exact: true }),
  ).toHaveAttribute("href", "/login");
  await expect(
    h.getByRole("link", { name: "Back to home", exact: true }),
  ).toHaveAttribute("href", "/");
  await expect(
    page.getByText("Public Read-Only Access vs. Authorized Workspace", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByText("NISR Hackathon", { exact: true })).toHaveCount(
    0,
  );
  for (const width of [320, 390, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 1300));
    expect(
      await h.evaluate((e) => Math.abs(e.getBoundingClientRect().top) < 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});
test("export planner profiles and all-season source coverage render with clear evidence", async ({
  page,
  request,
}) => {
  const d = await (
    await request.get("http://localhost:3000/api/v1/trade/public-explorer")
  ).json();
  expect(d.scenarios.length).toBe(380);
  expect(d.supply.length).toBe(1140);
  await page.goto("/public-portal?section=export");
  const profiles = page.getByRole("table", {
    name: "planner commodity trade profiles",
    exact: true,
  });
  await expect(profiles.locator("tbody tr")).toHaveCount(10);
  await expect(
    page
      .getByRole("table", { name: "market reference profiles", exact: true })
      .locator("tbody tr")
      .first(),
  ).toContainText("PLANNER_REFERENCE_PROFILE");
  await expect(
    page
      .getByRole("table", {
        name: "district planner supply estimates",
        exact: true,
      })
      .locator("tbody tr"),
  ).toHaveCount(30);
  const coverage = page.getByRole("table", {
    name: "seasonal export dataset coverage",
    exact: true,
  });
  await expect(coverage.locator("tbody tr")).toHaveCount(30);
  await expect(
    page.getByRole("button", { name: "Show more records", exact: true }).last(),
  ).toBeAttached();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download all-season production source records",
      exact: true,
    })
    .click();
  expect((await dl).suggestedFilename()).toBe(
    "all-season-production-sources.csv",
  );
});

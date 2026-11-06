import { test, expect } from "@playwright/test";
const live = process.env.LIVE_PORTAL_URL;
test.skip(
  !live,
  "Set LIVE_PORTAL_URL to verify the actual running local app without API mocks.",
);
test("running local irrigation endpoint and portal render successfully", async ({
  page,
}) => {
  const responses: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/irrigation/public-explorer"))
      responses.push(r.status());
  });
  await page.goto(live + "/public-portal?section=irrigation", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", {
      name: "National irrigation overview",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  expect(responses).toContain(200);
  await expect(
    page.getByRole("heading", { name: "Irrigation data could not be loaded" }),
  ).toHaveCount(0);
});
test("running local soil endpoint and portal render successfully", async ({
  page,
}) => {
  const responses: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/soil-fertility/public-explorer"))
      responses.push(r.status());
  });
  await page.goto(live + "/public-portal?section=soil", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("tab", {name:"Soil observations & planner context"}).click();
  await expect(
    page.getByRole("heading", {
      name: "National soil and fertility overview",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  expect(responses).toContain(200);
  await expect(
    page.getByLabel("Soil evidence source", { exact: true }),
  ).toHaveValue("observations");
});

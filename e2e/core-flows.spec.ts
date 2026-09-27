import { expect, test } from "@playwright/test";

test("explores and filters projects", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /Design systems/ })).toBeVisible();
  await page.getByLabel("Filter projects").fill("geospatial");

  const explorer = page.locator("#projects");
  await expect(explorer.getByText("Ride Hailing Platform")).toBeVisible();
  await expect(explorer.getByText("Hotel PMS")).not.toBeVisible();
});

test("opens project, navigates sections, and enlarges a diagram", async ({ page }) => {
  await page.goto("./projects/payment-platform/");
  await expect(page.getByRole("heading", { name: "Payment Platform", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Failure modes" }).click();
  await expect(page.locator("#failures")).toBeInViewport();

  const figure = page
    .locator("figure")
    .filter({ hasText: "Payment Platform application architecture" })
    .first();
  await expect(figure.locator(":scope > .diagram svg")).toBeVisible();
  await figure.getByRole("button", { name: "Enlarge" }).click();
  await expect(
    page.getByRole("dialog", { name: /Enlarged Payment Platform application architecture/ }),
  ).toBeVisible();
});

test("searches a pattern and persists the query in the URL", async ({ page }) => {
  await page.goto("./search/");
  await page.getByLabel("Search all content").fill("idempotency keys");
  await expect(page).toHaveURL(/q=idempotency\+keys|q=idempotency%20keys/);
  await expect(page.getByRole("heading", { name: "Idempotency Keys" })).toBeVisible();
  await page.getByRole("link", { name: /Idempotency Keys/ }).click();
  await expect(page.getByRole("heading", { name: "When not to use it" })).toBeVisible();
});

test("compares systems and persists theme", async ({ page }) => {
  await page.goto("./compare/");
  await expect(page.getByText("Common architecture concepts")).toBeVisible();

  const before = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  const expected = before === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
});

test("provides keyboard-accessible mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");

  const menu = page.getByLabel("Open navigation");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Learning paths" })).toBeVisible();
});

test("serves public index routes and a useful not-found page", async ({ page }) => {
  for (const route of ["patterns/", "edge-cases/", "learn/", "about/"]) {
    await page.goto(`./${route}`);
    await expect(page.locator("h1")).toHaveCount(1);
  }

  const response = await page.goto("./missing-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
  await expect(page.getByText(/page could not be found/i)).toBeVisible();
});

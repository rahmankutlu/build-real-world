import { expect, test, type Page } from "@playwright/test";
import { projects } from "../content/projects";

const diagramLabels = ["system context", "application architecture", "workflow sequence"];

async function expectNoMermaidErrors(page: Page) {
  await expect(page.locator("body")).not.toContainText("Syntax error in text");

  const escapedArtifacts = await page.evaluate(() => {
    const outsideFrames = (element: Element) => !element.closest(".diagram-frame");
    const temporaryNodes = [...document.querySelectorAll('[id^="mermaid-"], [id^="dmermaid-"], [id^="imermaid-"]')]
      .filter(outsideFrames);
    const errorSvgs = [...document.querySelectorAll("svg")]
      .filter(outsideFrames)
      .filter((svg) => /syntax error in text|mermaid version/i.test(svg.textContent ?? ""));
    return temporaryNodes.length + errorSvgs.length;
  });

  expect(escapedArtifacts).toBe(0);
}

async function expectMeasuredDiagrams(page: Page) {
  const diagrams = await page.locator(".diagram-frame > .diagram svg").evaluateAll((svgs) =>
    svgs.map((svg) => {
      const box = svg.getBoundingClientRect();
      const viewBox = (svg as SVGSVGElement).viewBox.baseVal;
      const labels = [...svg.querySelectorAll(".nodeLabel, .messageText, text.actor")];
      return {
        width: box.width,
        height: box.height,
        viewBoxWidth: viewBox.width,
        viewBoxHeight: viewBox.height,
        labels: labels.length,
        unmeasuredLabels: labels.filter((label) => {
          const rect = label.getBoundingClientRect();
          return (label.textContent ?? "").trim() !== "" && (rect.width === 0 || rect.height === 0);
        }).length,
      };
    }),
  );
  expect(diagrams).toHaveLength(3);
  for (const diagram of diagrams) {
    expect(diagram.width).toBeGreaterThan(100);
    expect(diagram.height).toBeGreaterThan(20);
    expect(diagram.viewBoxWidth).toBeGreaterThan(200);
    expect(diagram.viewBoxHeight).toBeGreaterThan(100);
    expect(diagram.labels).toBeGreaterThan(0);
    expect(diagram.unmeasuredLabels).toBe(0);
  }
}

test("renders every project diagram safely across themes", async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  let renderedDiagrams = 0;

  for (const [projectIndex, project] of projects.entries()) {
    await page.goto(`./projects/${project.slug}/`);

    const figures = page.locator(".diagram-frame");
    await expect(figures).toHaveCount(3);
    for (const label of diagramLabels) {
      await expect(figures.filter({ hasText: `${project.title} ${label}` })).toHaveCount(1);
    }

    await expect(figures.filter({ has: page.locator(":scope > .diagram svg") })).toHaveCount(3);
    await expect(figures.locator(":scope > .diagram svg")).toHaveCount(3);
    await expect(page.locator('.diagram-frame[data-diagram-state="rendered"]')).toHaveCount(3);
    await expectMeasuredDiagrams(page);
    await expectNoMermaidErrors(page);
    renderedDiagrams += 3;

    const currentTheme = await page.locator("html").getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "neutral" : "dark";
    const nextDocumentTheme = nextTheme === "neutral" ? "light" : "dark";
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", nextDocumentTheme);
    await expect(page.locator(`.diagram-frame[data-diagram-state="rendered"][data-diagram-theme="${nextTheme}"]`)).toHaveCount(3);
    await expect(figures.locator(":scope > .diagram svg")).toHaveCount(3);
    await expectMeasuredDiagrams(page);
    await expectNoMermaidErrors(page);

    if (projectIndex === 0) {
      await figures.first().getByRole("button", { name: "Enlarge" }).click();
      const dialog = page.getByRole("dialog", { name: `Enlarged ${project.title} system context` });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".diagram svg")).toBeVisible();
      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).not.toBeVisible();
    }
  }

  expect(renderedDiagrams).toBe(30);
  expect(pageErrors).toEqual([]);
});

for (const slug of ["ecommerce", "payment-platform"]) {
  test(`renders and enlarges the ${slug} workflow sequence`, async ({ page }) => {
    const project = projects.find((candidate) => candidate.slug === slug)!;
    await page.goto(`./projects/${slug}/`);

    const figure = page.locator(".diagram-frame").filter({ hasText: `${project.title} workflow sequence` });
    await expect(figure).toHaveAttribute("data-diagram-state", "rendered");
    await expect(figure.locator(":scope > .diagram svg")).toBeVisible();
    await expect(figure.locator(":scope > .diagram svg")).toContainText("Idempotency-Key");
    await expectNoMermaidErrors(page);

    await figure.getByRole("button", { name: "Enlarge" }).click();
    const dialog = page.getByRole("dialog", { name: `Enlarged ${project.title} workflow sequence` });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".diagram svg")).toBeVisible();
    await expect(dialog.locator(".diagram svg")).toContainText("Idempotency-Key");
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}

test("keeps diagrams usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./projects/payment-platform/");

  await expect(page.locator('.diagram-frame[data-diagram-state="rendered"]')).toHaveCount(3);
  await expectNoMermaidErrors(page);

  const layout = await page.evaluate(() => ({
    pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    frames: [...document.querySelectorAll<HTMLElement>(".diagram-frame > .diagram")].map((diagram) => ({
      right: diagram.getBoundingClientRect().right,
      scrollable: diagram.scrollWidth > diagram.clientWidth,
      overflowX: getComputedStyle(diagram).overflowX,
    })),
  }));
  expect(layout.pageOverflow).toBeLessThanOrEqual(1);
  for (const frame of layout.frames) {
    expect(frame.right).toBeLessThanOrEqual(391);
    if (frame.scrollable) expect(frame.overflowX).toBe("auto");
  }

  const figure = page.locator(".diagram-frame").filter({ hasText: "Payment Platform workflow sequence" });
  await figure.getByRole("button", { name: "Enlarge" }).click();
  await expect(page.getByRole("dialog", { name: "Enlarged Payment Platform workflow sequence" }).locator(".diagram svg")).toBeVisible();
});

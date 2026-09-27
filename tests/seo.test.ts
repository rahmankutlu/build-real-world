import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { projects } from "@/content/projects";
import { absoluteUrl, joinSiteUrl, withBasePath } from "@/lib/site";
import { articleJsonLd, breadcrumbJsonLd, jsonLd, pageMetadata, projectMetadata, sitePreview } from "@/lib/seo";
import { projectOgPath } from "@/lib/og-assets";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { generateMetadata as generatePatternMetadata } from "@/app/patterns/[slug]/page";
import { generateMetadata as generateEdgeMetadata } from "@/app/edge-cases/[slug]/page";

describe("public URL handling", () => {
  it("keeps the GitHub Pages repository path", () => expect(joinSiteUrl("https://rahmankutlu.github.io/build-real-world/", "/projects/ecommerce/")).toBe("https://rahmankutlu.github.io/build-real-world/projects/ecommerce/"));
  it("keeps local asset paths root-relative without a configured base", () => expect(withBasePath("/icon.svg")).toBe("/icon.svg"));
  it("generates absolute project canonicals and social cards", () => { const metadata = projectMetadata(projects[0]); expect(metadata.alternates?.canonical).toBe(absoluteUrl("/projects/ecommerce/")); expect(metadata.openGraph?.images).toBeTruthy(); expect(metadata.twitter && "card" in metadata.twitter ? metadata.twitter.card : undefined).toBe("summary_large_image"); });
  it("includes all public content and excludes search from sitemap", () => { const urls = sitemap().map((entry) => entry.url); expect(new Set(urls).size).toBe(urls.length); for (const project of projects) expect(urls).toContain(absoluteUrl(`/projects/${project.slug}/`)); expect(urls.some((url) => url.includes("/search/"))).toBe(false); });
});

describe("page metadata and structured data", () => {
  it("gives every project its own Open Graph image and alt text", () => {
    const images = projects.map((project) => {
      const metadata = projectMetadata(project);
      const [image] = metadata.openGraph?.images as Array<{ url: string; width: number; height: number; alt: string }>;
      expect(image).toMatchObject({ url: absoluteUrl(projectOgPath(project.slug)), width: 1200, height: 630 });
      expect(image.alt).toContain(project.title);
      return image.url;
    });
    expect(new Set(images).size).toBe(projects.length);
  });

  it("falls back to the site preview for non-project pages", () => {
    const metadata = pageMetadata({ title: "Patterns", description: "A description long enough for a page.", path: "/patterns/" });
    expect(metadata.openGraph?.images).toEqual([sitePreview]);
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(pageMetadata({ title: "Search", description: "Search", path: "/search/", index: false }).robots).toEqual({ index: false, follow: true });
  });

  it("builds a Home-first breadcrumb trail with absolute URLs", () => {
    const trail = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Patterns", path: "/patterns/" }, { name: "Outbox", path: "/patterns/outbox/" }]);
    expect(trail.itemListElement.map((item) => [item.position, item.name, item.item])).toEqual([
      [1, "Home", absoluteUrl("/")],
      [2, "Patterns", absoluteUrl("/patterns/")],
      [3, "Outbox", absoluteUrl("/patterns/outbox/")],
    ]);
  });

  it("describes articles without invented ratings or reviews", () => {
    const article = articleJsonLd({ headline: "Outbox pattern", description: "Publish reliably.", path: "/patterns/outbox/", resourceType: "Pattern guide", about: ["Outbox"] });
    expect(article).toMatchObject({ url: absoluteUrl("/patterns/outbox/"), license: "https://creativecommons.org/licenses/by/4.0/", learningResourceType: "Pattern guide" });
    expect(Object.keys(article).some((key) => /rating|review/i.test(key))).toBe(false);
  });

  it("escapes JSON-LD so content cannot close the script element", () => {
    expect(jsonLd({ text: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });

  it("covers patterns and edge cases in the sitemap with unique titles for every page", async () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const pattern of patterns) expect(urls).toContain(absoluteUrl(`/patterns/${pattern.slug}/`));
    for (const edgeCase of edgeCases) expect(urls).toContain(absoluteUrl(`/edge-cases/${edgeCase.slug}/`));

    const patternMeta = await Promise.all(patterns.map((p) => generatePatternMetadata({ params: Promise.resolve({ slug: p.slug }) })));
    const edgeMeta = await Promise.all(edgeCases.map((e) => generateEdgeMetadata({ params: Promise.resolve({ slug: e.slug }) })));
    const all = [...projects.map(projectMetadata), ...patternMeta, ...edgeMeta];
    const titles = all.map((metadata) => String(metadata.title));
    expect(new Set(titles).size).toBe(titles.length);
    for (const metadata of all) expect(String(metadata.description ?? "").length).toBeGreaterThanOrEqual(50);
  });
});

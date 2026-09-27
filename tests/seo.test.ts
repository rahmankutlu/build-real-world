import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { projects } from "@/content/projects";
import { absoluteUrl, joinSiteUrl, withBasePath } from "@/lib/site";
import { projectMetadata } from "@/lib/seo";

describe("public URL handling", () => {
  it("keeps the GitHub Pages repository path", () => expect(joinSiteUrl("https://rahmankutlu.github.io/build-real-world/", "/projects/ecommerce/")).toBe("https://rahmankutlu.github.io/build-real-world/projects/ecommerce/"));
  it("keeps local asset paths root-relative without a configured base", () => expect(withBasePath("/icon.svg")).toBe("/icon.svg"));
  it("generates absolute project canonicals and social cards", () => { const metadata = projectMetadata(projects[0]); expect(metadata.alternates?.canonical).toBe(absoluteUrl("/projects/ecommerce/")); expect(metadata.openGraph?.images).toBeTruthy(); expect(metadata.twitter && "card" in metadata.twitter ? metadata.twitter.card : undefined).toBe("summary_large_image"); });
  it("includes all public content and excludes search from sitemap", () => { const urls = sitemap().map((entry) => entry.url); expect(new Set(urls).size).toBe(urls.length); for (const project of projects) expect(urls).toContain(absoluteUrl(`/projects/${project.slug}/`)); expect(urls.some((url) => url.includes("/search/"))).toBe(false); });
});

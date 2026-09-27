import fs from "node:fs";
import path from "node:path";
import { site } from "../lib/site";
import { projects } from "../content/projects";
import { projectOgPath } from "../lib/og-assets";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const output = path.join(process.cwd(), "out");
const required = ["index.html", "404.html", "sitemap.xml", "robots.txt", "feed.xml", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.webmanifest", "social-preview.png", "projects/payment-platform/index.html", "patterns/idempotency-keys/index.html", "edge-cases/webhook-before-response/index.html"];
for (const file of required) assert(fs.existsSync(path.join(output, file)), `Static export missing ${file}`);

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const htmlFiles = walk(output).filter((file) => file.endsWith(".html"));
const titles = new Map<string, string>();
const canonicals = new Map<string, string>();
/** Maps a production URL to its exported file, or undefined when it points elsewhere. */
function exportedFile(url: string) {
  if (!url.startsWith(`${site.url}/`)) return undefined;
  const pathname = decodeURIComponent(url.slice(site.url.length).split(/[?#]/)[0]);
  return path.join(output, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
}
const meta = (html: string, key: string) => new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`).exec(html)?.[1];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(output, file);
  assert(!html.includes("build-real-world.dev"), `${relative}: placeholder domain found`);
  const notFound = /^(404|_not-found)(\/index)?\.html$/.test(relative);
  if (!notFound) assert((html.match(/<h1[ >]/g) ?? []).length === 1, `${relative}: expected exactly one h1`);
  if (!relative.startsWith("search/") && !notFound) {
    assert(html.includes(`<link rel="canonical" href="${site.url}`), `${relative}: canonical URL missing or wrong`);
    assert(html.includes('property="og:image"'), `${relative}: og:image missing`);
    assert(html.includes('name="twitter:card" content="summary_large_image"'), `${relative}: Twitter card missing`);
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    assert(title && title.length >= 10, `${relative}: title missing`);
    assert(!titles.has(title), `${relative}: duplicate title also used by ${titles.get(title)}`);
    titles.set(title, relative);
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)![1];
    assert(!canonicals.has(canonical), `${relative}: duplicate canonical also used by ${canonicals.get(canonical)}`);
    canonicals.set(canonical, relative);
    assert(exportedFile(canonical) && fs.existsSync(exportedFile(canonical)!), `${relative}: canonical ${canonical} is not an exported page`);
    assert((meta(html, "description") ?? "").length >= 50, `${relative}: meta description missing or too short`);
    assert(!/<meta name="robots" content="[^"]*noindex/.test(html), `${relative}: indexable page is noindex`);
    for (const key of ["og:image", "twitter:image"]) {
      const image = meta(html, key);
      assert(image && exportedFile(image) && fs.existsSync(exportedFile(image)!), `${relative}: ${key} ${image} does not resolve to an exported file`);
    }
    const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]) as { "@graph"?: Array<{ "@type": unknown; itemListElement?: Array<{ name: string; item: string }> }> });
    if (/^(projects|patterns|edge-cases)\/[^/]+\/index\.html$/.test(relative)) {
      const trail = jsonLdBlocks.flatMap((block) => block["@graph"] ?? []).find((node) => node["@type"] === "BreadcrumbList")?.itemListElement;
      assert(trail && trail[0].name === "Home" && trail.at(-1)!.item === canonical, `${relative}: BreadcrumbList must run from Home to the canonical page`);
      assert(html.includes('aria-label="Breadcrumb"'), `${relative}: visible breadcrumb missing`);
    }
  } else {
    assert(/<meta name="robots" content="[^"]*noindex/.test(html), `${relative}: search and not-found pages must be noindex`);
  }
  if (basePath) for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) assert(match[1] === basePath || match[1].startsWith(`${basePath}/`), `${relative}: root path escapes basePath: ${match[1]}`);
}
for (const project of projects) {
  const html = fs.readFileSync(path.join(output, "projects", project.slug, "index.html"), "utf8");
  assert(meta(html, "og:image") === `${site.url}${projectOgPath(project.slug)}`, `${project.slug}: og:image must be the project's own preview`);
}
const sitemapXml = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(sitemapUrls.includes(`${site.url}/projects/payment-platform/`), "Exported sitemap has wrong origin");
for (const url of sitemapUrls) assert(exportedFile(url) && fs.existsSync(exportedFile(url)!), `Sitemap URL is not an exported page: ${url}`);
const feed = fs.readFileSync(path.join(output, "feed.xml"), "utf8");
assert(feed.startsWith('<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom">') && feed.endsWith("</feed>"), "Feed is not an Atom document");
for (const match of feed.matchAll(/<link href="([^"]+)"/g)) assert(exportedFile(match[1]) && fs.existsSync(exportedFile(match[1])!), `Feed link is not exported: ${match[1]}`);
assert(fs.readFileSync(path.join(output, "robots.txt"), "utf8").includes(`${site.url}/sitemap.xml`), "Exported robots has wrong sitemap");
console.log(`Static export valid: ${htmlFiles.length} HTML pages${basePath ? ` under ${basePath}` : ""}, ${sitemapUrls.length} sitemap URLs, ${titles.size} unique titles.`);

function walk(directory: string): string[] { return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const target = path.join(directory, entry.name); return entry.isDirectory() ? walk(target) : [target]; }); }

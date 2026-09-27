import fs from "node:fs";
import path from "node:path";
import sitemap from "../app/sitemap";
import { projects } from "../content/projects";
import { absoluteUrl, site } from "../lib/site";
import { projectMetadata } from "../lib/seo";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(site.url === "https://rahmankutlu.github.io/build-real-world" || process.env.NEXT_PUBLIC_SITE_URL === site.url, `Unexpected production site URL: ${site.url}`);
assert(!site.url.includes("build-real-world.dev"), "Placeholder domain remains in site configuration");

const metadata = projects.map(projectMetadata);
const titles = metadata.map((item) => String(item.title));
assert(new Set(titles).size === projects.length, "Project SEO titles must be unique");
for (const [index, item] of metadata.entries()) {
  const slug = projects[index].slug;
  assert(typeof item.description === "string" && item.description.length >= 80, `${slug}: SEO description is too short`);
  assert(item.alternates?.canonical === absoluteUrl(`/projects/${slug}/`), `${slug}: canonical URL is incorrect`);
  assert(item.openGraph?.images && Array.isArray(item.openGraph.images) && item.openGraph.images.length > 0, `${slug}: Open Graph image missing`);
  assert(item.twitter && "card" in item.twitter && item.twitter.card === "summary_large_image", `${slug}: Twitter card missing`);
  assert(item.robots && typeof item.robots === "object" && item.robots.index !== false, `${slug}: must be indexable`);
}

const urls = sitemap().map((item) => item.url);
assert(new Set(urls).size === urls.length, "Sitemap contains duplicate URLs");
assert(!urls.some((url) => url.includes("/search/")), "Search page must not be indexed in sitemap");
for (const project of projects) assert(urls.includes(absoluteUrl(`/projects/${project.slug}/`)), `Sitemap missing ${project.slug}`);

const preview = path.join(process.cwd(), "public/social-preview.png");
assert(fs.existsSync(preview), "Social preview image missing");
const png = fs.readFileSync(preview);
assert(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, "Social preview must be 1200x630");

const scanRoots = ["app", "components", "content", "lib", "README.md"];
for (const root of scanRoots) {
  const target = path.join(process.cwd(), root);
  const files = fs.statSync(target).isDirectory() ? walk(target) : [target];
  for (const file of files) assert(!fs.readFileSync(file, "utf8").includes("build-real-world.dev"), `Placeholder domain found in ${path.relative(process.cwd(), file)}`);
}
console.log(`SEO valid: ${metadata.length} unique project pages, ${urls.length} sitemap URLs, 1200x630 social preview.`);

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : /\.(ts|tsx|md)$/.test(entry.name) ? [target] : [];
  });
}

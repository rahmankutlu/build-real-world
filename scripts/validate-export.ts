import fs from "node:fs";
import path from "node:path";
import { site } from "../lib/site";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const output = path.join(process.cwd(), "out");
const required = ["index.html", "404.html", "sitemap.xml", "robots.txt", "feed.xml", "icon.svg", "manifest.webmanifest", "social-preview.png", "projects/payment-platform/index.html", "patterns/idempotency-keys/index.html", "edge-cases/webhook-before-response/index.html"];
for (const file of required) assert(fs.existsSync(path.join(output, file)), `Static export missing ${file}`);

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const htmlFiles = walk(output).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relative = path.relative(output, file);
  assert(!html.includes("build-real-world.dev"), `${relative}: placeholder domain found`);
  if (relative !== "404.html") assert((html.match(/<h1[ >]/g) ?? []).length === 1, `${relative}: expected exactly one h1`);
  if (!relative.startsWith("search/")) {
    assert(html.includes(`<link rel="canonical" href="${site.url}`), `${relative}: canonical URL missing or wrong`);
    assert(html.includes('property="og:image"'), `${relative}: og:image missing`);
    assert(html.includes('name="twitter:card" content="summary_large_image"'), `${relative}: Twitter card missing`);
  }
  if (basePath) for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) assert(match[1] === basePath || match[1].startsWith(`${basePath}/`), `${relative}: root path escapes basePath: ${match[1]}`);
}
assert(fs.readFileSync(path.join(output, "sitemap.xml"), "utf8").includes(`${site.url}/projects/payment-platform/`), "Exported sitemap has wrong origin");
assert(fs.readFileSync(path.join(output, "robots.txt"), "utf8").includes(`${site.url}/sitemap.xml`), "Exported robots has wrong sitemap");
console.log(`Static export valid: ${htmlFiles.length} HTML pages${basePath ? ` under ${basePath}` : ""}.`);

function walk(directory: string): string[] { return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const target = path.join(directory, entry.name); return entry.isDirectory() ? walk(target) : [target]; }); }

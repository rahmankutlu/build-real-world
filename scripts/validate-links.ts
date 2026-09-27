import fs from "node:fs";
import path from "node:path";
import { projects } from "../content/projects";
import { patterns } from "../content/patterns";
import { edgeCases } from "../content/edge-cases";

const known = new Set(["/", "/patterns/", "/edge-cases/", "/learn/", "/compare/", "/search/", "/about/", "/feed.xml", ...projects.map((p) => `/projects/${p.slug}/`), ...patterns.map((p) => `/patterns/${p.slug}/`), ...edgeCases.map((e) => `/edge-cases/${e.slug}/`)]);
const roots = ["app", "components"];
const files: string[] = [];
function walk(dir: string) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const next = path.join(dir, entry.name); if (entry.isDirectory()) walk(next); else if (/\.tsx?$/.test(entry.name)) files.push(next); } }
roots.forEach((dir) => walk(path.join(process.cwd(), dir)));
const broken: string[] = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/href=["'](\/[a-z0-9./?=#-]*)["']/g)) {
    const raw = match[1]; const base = raw.split(/[?#]/)[0]; const normalized = base === "/" || base.endsWith(".xml") ? base : `${base.replace(/\/$/, "")}/`;
    if (!known.has(normalized)) broken.push(`${path.relative(process.cwd(), file)} → ${raw}`);
  }
}
if (broken.length) throw new Error(`Broken internal links:\n${broken.join("\n")}`);
console.log(`Internal links valid across ${files.length} source files.`);

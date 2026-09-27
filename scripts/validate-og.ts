import fs from "node:fs";
import path from "node:path";
import { projects } from "../content/projects";
import { hashOgInput, ogManifestPath, ogSize, projectOgInput, projectOgPath, siteOgCopy } from "../lib/og-assets";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Width and height from a PNG IHDR chunk. */
function pngSize(file: string) {
  const header = fs.readFileSync(file).subarray(0, 24);
  assert(header.toString("latin1", 1, 4) === "PNG", `${file} is not a PNG`);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function checkImage(file: string, expected: { width: number; height: number }) {
  assert(fs.existsSync(file), `Missing ${file}; run npm run og`);
  const size = pngSize(file);
  assert(size.width === expected.width && size.height === expected.height, `${file} is ${size.width}x${size.height}, expected ${expected.width}x${expected.height}`);
}

assert(fs.existsSync(ogManifestPath), `Missing ${ogManifestPath}; run npm run og`);
const manifest = JSON.parse(fs.readFileSync(ogManifestPath, "utf8")) as Record<string, string>;
const expected: Record<string, string> = { "social-preview": hashOgInput(siteOgCopy) };
for (const project of projects) expected[`projects/${project.slug}`] = hashOgInput(projectOgInput(project));

const stale = Object.keys(expected).filter((key) => manifest[key] !== expected[key]);
const orphaned = Object.keys(manifest).filter((key) => !(key in expected));
assert(stale.length === 0, `Open Graph images are stale for: ${stale.join(", ")}; run npm run og`);
assert(orphaned.length === 0, `Open Graph manifest lists removed images: ${orphaned.join(", ")}; run npm run og`);

checkImage("public/social-preview.png", ogSize);
for (const project of projects) checkImage(path.join("public", projectOgPath(project.slug)), ogSize);
checkImage("public/apple-touch-icon.png", { width: 180, height: 180 });
checkImage("public/icon-192.png", { width: 192, height: 192 });
checkImage("public/icon-512.png", { width: 512, height: 512 });

console.log(`Open Graph valid: site preview and ${projects.length} project images are current.`);

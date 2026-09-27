import fs from "node:fs";
import path from "node:path";
import { projectMetadataSchema } from "../lib/content-schema";
import { projects } from "../content/projects";
import { patterns } from "../content/patterns";
import { edgeCases } from "../content/edge-cases";
import { learningPaths } from "../content/learning-paths";

const root = process.cwd();
const projectDir = path.join(root, "content/projects");
const metadataFiles = fs.readdirSync(projectDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(projectDir, entry.name, "metadata.json")).filter(fs.existsSync);
const parsed = metadataFiles.map((file) => projectMetadataSchema.parse(JSON.parse(fs.readFileSync(file, "utf8"))));
const duplicate = <T>(values: T[]) => values.find((value, index) => values.indexOf(value) !== index);
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

assert(parsed.length === 10, `Expected exactly 10 project metadata files, found ${parsed.length}`);
assert(projects.length === 10, `Expected exactly 10 registered projects, found ${projects.length}`);
assert(!duplicate(parsed.map((item) => item.slug)), "Duplicate project metadata slug");
assert(!duplicate(projects.map((item) => item.slug)), "Duplicate registered project slug");
assert(patterns.length >= 15, `Expected at least 15 patterns, found ${patterns.length}`);
assert(edgeCases.length >= 30, `Expected at least 30 edge cases, found ${edgeCases.length}`);
assert(!duplicate(patterns.map((item) => item.slug)), "Duplicate pattern slug");
assert(!duplicate(edgeCases.map((item) => item.slug)), "Duplicate edge-case slug");

for (const project of projects) {
  assert(project.failures.length >= 5, `${project.slug}: needs at least 5 failures`);
  assert(project.security.length >= 5, `${project.slug}: needs at least 5 security controls`);
  assert(project.tables.length >= 3, `${project.slug}: needs at least 3 important tables`);
  assert(project.endpoints.length >= 5, `${project.slug}: needs at least 5 endpoints`);
  assert(project.scale.length === 3, `${project.slug}: needs exactly 3 scale stages`);
  assert(project.diagrams.context.startsWith("flowchart"), `${project.slug}: missing context diagram`);
  assert(project.diagrams.architecture.startsWith("flowchart"), `${project.slug}: missing architecture diagram`);
  assert(project.diagrams.sequence.startsWith("sequenceDiagram"), `${project.slug}: missing sequence diagram`);
  assert(project.testing.some((item) => item.layer.toLowerCase().includes("concurrency")), `${project.slug}: missing concurrency test strategy`);
}
const projectSlugs = new Set(projects.map((item) => item.slug));
for (const pathItem of learningPaths) for (const ref of pathItem.projects) assert(projectSlugs.has(ref), `Learning path ${pathItem.slug} references missing project ${ref}`);
for (const item of edgeCases) for (const ref of item.projects) assert(projectSlugs.has(ref), `Edge case ${item.slug} references missing project ${ref}`);

console.log(`Content valid: ${projects.length} projects, ${patterns.length} patterns, ${edgeCases.length} edge cases, ${learningPaths.length} paths.`);

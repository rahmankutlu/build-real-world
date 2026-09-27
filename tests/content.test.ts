import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { learningPaths } from "@/content/learning-paths";

describe("content graph", () => {
  it("has exactly ten distinct flagship projects", () => { expect(projects).toHaveLength(10); expect(new Set(projects.map((p) => p.slug)).size).toBe(10); });
  it("keeps the v0.1 depth floor", () => { for (const p of projects) { expect(p.failures.length).toBeGreaterThanOrEqual(5); expect(p.security.length).toBeGreaterThanOrEqual(5); expect(Object.values(p.diagrams)).toHaveLength(3); } });
  it("has unique library slugs", () => { const all = [...patterns.map((p) => `p:${p.slug}`), ...edgeCases.map((e) => `e:${e.slug}`)]; expect(new Set(all).size).toBe(all.length); });
  it("resolves every cross-reference", () => { const slugs = new Set(projects.map((p) => p.slug)); for (const path of learningPaths) for (const ref of path.projects) expect(slugs.has(ref)).toBe(true); for (const edge of edgeCases) for (const ref of edge.projects) expect(slugs.has(ref)).toBe(true); });
});

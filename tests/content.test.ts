import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { learningPaths } from "@/content/learning-paths";
import { projectRelationships } from "@/content/relationships";

describe("content graph", () => {
  it("has exactly ten distinct flagship projects", () => { expect(projects).toHaveLength(10); expect(new Set(projects.map((p) => p.slug)).size).toBe(10); });
  it("keeps the v0.1 depth floor", () => { for (const p of projects) { expect(p.failures.length).toBeGreaterThanOrEqual(5); expect(p.security.length).toBeGreaterThanOrEqual(5); expect(Object.values(p.diagrams)).toHaveLength(3); } });
  it("has unique library slugs", () => { const all = [...patterns.map((p) => `p:${p.slug}`), ...edgeCases.map((e) => `e:${e.slug}`)]; expect(new Set(all).size).toBe(all.length); });
  it("resolves every cross-reference", () => { const slugs = new Set(projects.map((p) => p.slug)); for (const path of learningPaths) for (const ref of path.projects) expect(slugs.has(ref)).toBe(true); for (const edge of edgeCases) for (const ref of edge.projects) expect(slugs.has(ref)).toBe(true); });
  it("keeps project observability and relationships specific", () => { expect(new Set(projects.map((project) => JSON.stringify(project.observability))).size).toBe(projects.length); expect(Object.keys(projectRelationships).sort()).toEqual(projects.map((project) => project.slug).sort()); });
  it("does not repeat substantive sentences across three or more case studies", () => {
    const owners = new Map<string, Set<string>>();
    const visit = (slug: string, value: unknown): void => {
      if (typeof value === "string") {
        if (value.length >= 40) owners.set(value, (owners.get(value) ?? new Set()).add(slug));
      } else if (Array.isArray(value)) value.forEach((item) => visit(slug, item));
      else if (value && typeof value === "object") Object.values(value).forEach((item) => visit(slug, item));
    };
    for (const project of projects) visit(project.slug, project);
    const boilerplate = [...owners].filter(([, slugs]) => slugs.size >= 3).map(([text]) => text);
    expect(boilerplate).toEqual([]);
  });
  it("gives every project its own scale decision rules", () => {
    for (const stage of [0, 1, 2]) {
      expect(new Set(projects.map((project) => project.scale[stage].pressure)).size).toBe(projects.length);
      expect(new Set(projects.map((project) => project.scale[stage].architecture)).size).toBe(projects.length);
    }
  });
});

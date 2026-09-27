import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";

describe("search corpus", () => {
  const corpus = [...projects, ...patterns, ...edgeCases].map((x) => JSON.stringify(x).toLowerCase());
  it("connects idempotency across all content types", () => { expect(projects.some((x) => JSON.stringify(x).toLowerCase().includes("idempotency"))).toBe(true); expect(patterns.some((x) => x.slug === "idempotency-keys")).toBe(true); expect(edgeCases.some((x) => JSON.stringify(x).toLowerCase().includes("idempotency"))).toBe(true); });
  it("contains searchable non-empty documents", () => expect(corpus.every((x) => x.length > 100)).toBe(true));
});

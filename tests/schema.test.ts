import { describe, expect, it } from "vitest";
import { projectMetadataSchema } from "@/lib/content-schema";
import ecommerce from "@/content/projects/ecommerce/metadata.json";

describe("project metadata schema", () => {
  it("accepts a valid project", () => expect(projectMetadataSchema.safeParse(ecommerce).success).toBe(true));
  it("rejects malformed slugs and missing topics", () => expect(projectMetadataSchema.safeParse({ ...ecommerce, slug: "Bad Slug", topics: [] }).success).toBe(false));
});

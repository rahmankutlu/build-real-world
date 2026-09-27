import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/patterns/", "/edge-cases/", "/learn/", "/compare/", "/about/", ...projects.map((p) => `/projects/${p.slug}/`), ...patterns.map((p) => `/patterns/${p.slug}/`), ...edgeCases.map((e) => `/edge-cases/${e.slug}/`)];
  return paths.map((path) => ({ url: absoluteUrl(path), lastModified: "2026-09-27", changeFrequency: path.startsWith("/projects/") ? "monthly" : "weekly", priority: path === "/" ? 1 : path.startsWith("/projects/") ? 0.8 : 0.6 }));
}

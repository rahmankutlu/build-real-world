import { createHash } from "node:crypto";
import type { Project } from "./types";

export const ogDirectory = "public/og";
export const ogManifestPath = `${ogDirectory}/manifest.json`;
export const ogSize = { width: 1200, height: 630 } as const;

/** Public path (before basePath) of a project's Open Graph image. */
export function projectOgPath(slug: string) {
  return `/og/projects/${slug}.png`;
}

/** The content each project image renders; a change here means the PNG is stale. */
export function projectOgInput(project: Project) {
  return {
    title: project.title,
    summary: project.summary,
    difficulty: project.difficulty,
    topics: project.topics.slice(0, 4),
    primaryDb: project.primaryDb,
    traits: projectTraits(project),
  };
}

export function projectTraits(project: Project) {
  return [
    project.realtime && "Realtime",
    project.queue && "Queue",
    project.payments && "Payments",
    project.multiTenancy && "Multi-tenant",
  ].filter((trait): trait is string => Boolean(trait));
}

export function hashOgInput(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);
}

/** Copy for the site-wide preview (README hero, GitHub social preview, non-project pages). */
export const siteOgCopy = {
  headline: "System design, one real product at a time.",
  summary: "Data models, transactions, failure modes, and scale decisions for commerce, payments, realtime, media, and SaaS systems.",
  flow: ["Request", "Transaction", "Outbox", "Queue", "Worker"],
  url: "rahmankutlu.github.io/build-real-world",
} as const;

export const site = {
  name: "Build Real World",
  tagline: "Production-grade system design, one real-world product at a time.",
  description: "System design case studies that connect product requirements to architecture, data models, APIs, failure modes, security, observability, and scale.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahmankutlu.github.io/build-real-world").replace(/\/$/, ""),
  github: "https://github.com/rahmankutlu/build-real-world",
  author: "Abdurrahman Kutlu",
  releaseDate: "2026-09-27",
};

export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export function joinSiteUrl(base: string, path = "/") {
  if (!path || path === "/") return `${base.replace(/\/$/, "")}/`;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\/+/g, "")}`;
}

export function absoluteUrl(path = "/") { return joinSiteUrl(site.url, path); }
export function withBasePath(path: string) { return `${basePath}/${path.replace(/^\/+/g, "")}` || "/"; }

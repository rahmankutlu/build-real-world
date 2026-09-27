import { projects } from "@/content/projects";
import { site } from "@/lib/site";

export const dynamic = "force-static";
export function GET() {
  const items = projects.map((p) => `<entry><title>${escapeXml(p.title)}</title><id>${site.url}/projects/${p.slug}/</id><link href="${site.url}/projects/${p.slug}/"/><summary>${escapeXml(p.summary)}</summary></entry>`).join("");
  return new Response(`<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${site.name}</title><id>${site.url}/</id><link href="${site.url}/feed.xml" rel="self"/><updated>2026-09-27T00:00:00Z</updated>${items}</feed>`, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
function escapeXml(value: string) { return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]!); }

import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";
export function GET() {
  const projectEntries = projects.map((p) => entry(p.title, p.summary, `/projects/${p.slug}/`));
  const patternEntries = patterns.map((p) => entry(p.title.endsWith("Pattern") ? p.title : `${p.title} pattern`, p.summary, `/patterns/${p.slug}/`));
  return new Response(`<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${site.name}</title><subtitle>${escapeXml(site.description)}</subtitle><id>${absoluteUrl("/")}</id><link href="${absoluteUrl("/feed.xml")}" rel="self"/><link href="${absoluteUrl("/")}"/><updated>${site.releaseDate}T00:00:00Z</updated>${[...projectEntries, ...patternEntries].join("")}</feed>`, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
function entry(title: string, summary: string, path: string) { const url = absoluteUrl(path); return `<entry><title>${escapeXml(title)}</title><id>${url}</id><link href="${url}"/><updated>${site.releaseDate}T00:00:00Z</updated><summary>${escapeXml(summary)}</summary></entry>`; }
function escapeXml(value: string) { return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]!); }

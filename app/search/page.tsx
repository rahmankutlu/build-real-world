import type { Metadata } from "next";
import { Suspense } from "react";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { SearchClient, type SearchItem } from "@/components/search-client";

export const metadata: Metadata = { title: "Search", description: "Search projects, engineering patterns, edge cases, and architecture concepts." };
const index: SearchItem[] = [
  ...projects.map((p) => ({ type: "Project", title: p.title, summary: p.summary, href: `/projects/${p.slug}/`, text: JSON.stringify(p) })),
  ...patterns.map((p) => ({ type: "Pattern", title: p.title, summary: p.summary, href: `/patterns/${p.slug}/`, text: JSON.stringify(p) })),
  ...edgeCases.map((e) => ({ type: "Edge case", title: e.title, summary: e.mitigation, href: `/edge-cases/${e.slug}/`, text: JSON.stringify(e) })),
];
export default function SearchPage() { return <div className="shell search-page"><div className="eyebrow">Full-text library search</div><h1>Find the engineering decision.</h1><Suspense fallback={<div>Loading search…</div>}><SearchClient index={index} /></Suspense></div>; }

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { edgeCaseBySlug, edgeCases } from "@/content/edge-cases";
import { projectBySlug } from "@/content/projects";
import { articleJsonLd, breadcrumbJsonLd, jsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function generateStaticParams() { return edgeCases.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const item = edgeCaseBySlug.get((await params).slug); return item ? pageMetadata({ title: `${item.title}: Failure & Mitigation`, description: `${item.why} Understand the resulting bug and the architectural mitigation.`, path: `/edge-cases/${item.slug}/`, type: "article" }) : {}; }
export default async function EdgeCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const item = edgeCaseBySlug.get((await params).slug); if (!item) notFound();
  const path = `/edge-cases/${item.slug}/`;
  const crumbs = [{ name: "Home", path: "/" }, { name: "Edge cases", path: "/edge-cases/" }, { name: item.title, path }];
  const structuredData = { "@context": "https://schema.org", "@graph": [articleJsonLd({ headline: item.title, description: item.why, path, resourceType: "Failure case", about: [item.category] }), breadcrumbJsonLd(crumbs)] };
  return <div className="shell doc-layout" style={{ gridTemplateColumns: "220px minmax(0, 740px)" }}><aside className="toc"><div className="toc-label">Edge case</div><a href="#why">Why it happens</a><a href="#bug">Potential bug</a><a href="#mitigation">Mitigation</a><a href="#projects">Case studies</a></aside><article className="doc"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} /><header className="doc-header"><Breadcrumbs crumbs={crumbs} /><div className="meta-row"><span className="tag accent">{item.category}</span></div><h1>{item.title}</h1></header><section className="doc-section" id="why"><h2>Why it happens</h2><p>{item.why}</p></section><section className="doc-section" id="bug"><h2>Potential bug</h2><p>{item.bug}</p></section><section className="doc-section" id="mitigation"><h2>Mitigation</h2><p className="note">{item.mitigation}</p></section><section className="doc-section" id="projects"><h2>See it in context</h2><ul>{item.projects.map((slug) => <li key={slug}><Link className="text-link" href={`/projects/${slug}/#failures`}>{projectBySlug.get(slug)?.title} →</Link></li>)}</ul></section></article></div>;
}

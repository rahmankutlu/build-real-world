import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { patternBySlug, patterns } from "@/content/patterns";
import { CopyBlock } from "@/components/copy-block";

export function generateStaticParams() { return patterns.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const p = patternBySlug.get((await params).slug); return p ? { title: p.title, description: p.summary } : {}; }
export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const pattern = patternBySlug.get((await params).slug); if (!pattern) notFound();
  return <div className="shell doc-layout" style={{ gridTemplateColumns: "220px minmax(0, 740px)" }}><aside className="toc"><div className="toc-label">Pattern guide</div><a href="#problem">Problem</a><a href="#when">When to use it</a><a href="#avoid">When not to</a><a href="#example">Minimal example</a><a href="#tradeoffs">Tradeoffs</a></aside><article className="doc"><header className="doc-header"><div className="breadcrumb"><Link href="/patterns/">Patterns</Link><span>/</span><span>{pattern.title}</span></div><h1>{pattern.title}</h1><p className="doc-lead">{pattern.summary}</p></header><section className="doc-section" id="problem"><h2>Problem</h2><p>{pattern.problem}</p></section><section className="doc-section" id="when"><h2>When to use it</h2><ul>{pattern.useWhen.map((x) => <li key={x}>{x}</li>)}</ul></section><section className="doc-section" id="avoid"><h2>When not to use it</h2><ul>{pattern.avoidWhen.map((x) => <li key={x}>{x}</li>)}</ul></section><section className="doc-section" id="example"><h2>Minimal example</h2><CopyBlock>{pattern.example}</CopyBlock></section><section className="doc-section" id="tradeoffs"><h2>Tradeoffs</h2><ul>{pattern.tradeoffs.map((x) => <li key={x}>{x}</li>)}</ul></section></article></div>;
}

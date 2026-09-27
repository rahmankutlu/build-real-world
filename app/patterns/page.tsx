import type { Metadata } from "next";
import Link from "next/link";
import { patterns } from "@/content/patterns";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Software Architecture Patterns", description: "Practical engineering patterns with selection criteria, counterexamples, minimal examples, and honest tradeoffs.", path: "/patterns/" });
export default function PatternsPage() { return <div className="shell search-page"><div className="eyebrow">Engineering library</div><h1>Patterns, without the hype.</h1><p className="hero-copy">Start from a failure or constraint. Add the smallest pattern that addresses it, and know when not to use it.</p><div className="project-grid" style={{ marginTop: 36 }}>{patterns.map((pattern) => <Link className="project-card" style={{ minHeight: 210 }} href={`/patterns/${pattern.slug}/`} key={pattern.slug}><div className="card-kicker"><span>Pattern</span><span>{String(patterns.indexOf(pattern) + 1).padStart(2, "0")}</span></div><h3>{pattern.title}</h3><p>{pattern.summary}</p><div className="meta-row"><span className="tag">Tradeoffs included</span></div></Link>)}</div></div>; }

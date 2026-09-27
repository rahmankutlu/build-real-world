import Link from "next/link";
import { ArrowRight, GitCompare, Search } from "lucide-react";
import { projects } from "@/content/projects";
import { patterns } from "@/content/patterns";
import { edgeCases } from "@/content/edge-cases";
import { learningPaths } from "@/content/learning-paths";
import { ProjectExplorer } from "@/components/project-explorer";

export default function HomePage() {
  return <>
    <section className="hero"><div className="shell">
      <div className="eyebrow">Open-source engineering curriculum</div>
      <h1>Design systems that survive the real world.</h1>
      <p className="hero-copy">Learn software engineering by designing production-grade systems from scratch—from product requirements and data models to races, failures, security, observability, and scale.</p>
      <div className="hero-links"><Link className="button primary" href="#projects">Explore the systems <ArrowRight size={16} /></Link><Link className="button" href="/search/"><Search size={16} /> Search the library</Link><Link className="button" href="/compare/"><GitCompare size={16} /> Compare architectures</Link></div>
      <div className="principles"><div className="principle"><strong>Start with the product</strong><span>Actors, workflows, constraints, and non-goals before infrastructure.</span></div><div className="principle"><strong>Correctness before scale</strong><span>Transactions, idempotency, concurrency, and explicit consistency.</span></div><div className="principle"><strong>Evolve with evidence</strong><span>Simple beginnings and workload-driven architecture transitions.</span></div></div>
    </div></section>
    <section className="section" id="projects"><div className="shell"><div className="section-heading"><div><div className="eyebrow">10 flagship systems</div><h2>Project explorer</h2><p>Each case study makes its own domain tradeoffs. Filter by the engineering problem you want to understand.</p></div><Link className="text-link" href="/compare/">Compare two systems →</Link></div><ProjectExplorer projects={projects} /></div></section>
    <section className="section"><div className="shell"><div className="section-heading"><div><div className="eyebrow">Guided progression</div><h2>Learning paths</h2><p>Move through case studies in an order that builds the relevant mental model.</p></div><Link className="text-link" href="/learn/">View paths →</Link></div><div className="path-grid">{learningPaths.map((path) => <Link href={`/learn/#${path.slug}`} className="path-card" key={path.slug}><h3>{path.title}</h3><p>{path.description}</p><ol className="path-list">{path.projects.map((slug) => <li key={slug}>{projects.find((p) => p.slug === slug)?.title}</li>)}</ol></Link>)}</div></div></section>
    <section className="section"><div className="shell"><div className="section-heading"><div><div className="eyebrow">Reusable reasoning</div><h2>Engineering library</h2><p>Patterns explain when not to add complexity. Edge cases begin with the failure you will actually meet.</p></div></div><div className="library-grid"><Link href="/patterns/" className="library-card"><h3>{patterns.length} engineering patterns</h3><p>Minimal examples, selection criteria, and honest tradeoffs.</p></Link><Link href="/edge-cases/" className="library-card"><h3>{edgeCases.length} edge cases</h3><p>Failure mechanism, resulting bug, and concrete mitigation.</p></Link><Link href="/search/?q=idempotency" className="library-card"><h3>Connected search</h3><p>Find a concept across projects, patterns, and edge cases.</p></Link><Link href="/compare/" className="library-card"><h3>Architecture comparison</h3><p>Contrast shared concepts and domain-specific decisions.</p></Link></div></div></section>
  </>;
}

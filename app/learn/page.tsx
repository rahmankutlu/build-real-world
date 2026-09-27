import type { Metadata } from "next";
import Link from "next/link";
import { learningPaths } from "@/content/learning-paths";
import { projectBySlug } from "@/content/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "System Design Learning Paths", description: "Curated routes through backend foundations, distributed systems, realtime architecture, and multi-tenant SaaS design.", path: "/learn/" });
export default function LearnPage() { return <div className="shell search-page"><div className="eyebrow">Curated curriculum</div><h1>Build the mental model in order.</h1><p className="hero-copy">Each path progresses through different products so the pattern stays connected to its domain constraints.</p>{learningPaths.map((path) => <section className="doc-section" id={path.slug} key={path.slug}><h2>{path.title}</h2><p>{path.description}</p><div className="project-grid">{path.projects.map((slug, index) => { const p = projectBySlug.get(slug)!; return <Link className="project-card" style={{ minHeight: 180 }} href={`/projects/${slug}/`} key={slug}><div className="card-kicker"><span>Step {index + 1}</span><span>{p.difficulty}</span></div><h3>{p.title}</h3><p>{p.summary}</p></Link>; })}</div></section>)}</div>; }

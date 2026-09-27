import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, projectBySlug } from "@/content/projects";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { CopyBlock } from "@/components/copy-block";
import { site } from "@/lib/site";

const sections = ["overview", "requirements", "workflows", "domain-model", "database", "apis", "architecture", "events", "failures", "consistency", "caching-jobs", "security", "observability", "testing", "deployment", "scaling"];
const labels: Record<string, string> = { overview: "Overview", requirements: "Requirements", workflows: "Workflows", "domain-model": "Domain model", database: "Database", apis: "APIs", architecture: "Architecture", events: "Events", failures: "Failure modes", consistency: "Consistency & concurrency", "caching-jobs": "Caching & jobs", security: "Security", observability: "Observability", testing: "Testing", deployment: "Deployment", scaling: "Scale evolution" };

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = projectBySlug.get((await params).slug);
  if (!project) return {};
  const title = `${project.title} system design`;
  const url = `/projects/${project.slug}/`;
  return { title, description: project.summary, alternates: { canonical: url }, openGraph: { title, description: project.summary, url, type: "article" } };
}

function StringList({ items }: { items: string[] }) { return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>; }

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = projectBySlug.get((await params).slug);
  if (!project) notFound();
  const apiText = project.endpoints.map((e) => `${e.method.padEnd(6)} ${e.path}`).join("\n");
  const jsonLd = { "@context": "https://schema.org", "@type": "TechArticle", headline: `${project.title} system design`, description: project.summary, author: { "@type": "Organization", name: site.name }, mainEntityOfPage: `${site.url}/projects/${project.slug}/`, educationalLevel: project.difficulty, about: project.topics };
  return <div className="shell doc-layout">
    <aside className="toc" aria-label="On this page"><div className="toc-label">On this page</div>{sections.map((id) => <a href={`#${id}`} key={id}>{labels[id]}</a>)}</aside>
    <article className="doc">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="doc-header"><div className="breadcrumb"><Link href="/">Projects</Link><span>/</span><span>{project.title}</span></div><div className="meta-row"><span className="tag accent">{project.difficulty}</span>{project.topics.map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div><h1>{project.title}</h1><p className="doc-lead">{project.summary}</p></header>
      <section className="doc-section" id="overview"><h2>Product overview</h2><p>{project.purpose}</p><h3>Main actors</h3><p>{project.actors.join(", ")}.</p><h3>Assumptions</h3><StringList items={project.assumptions} /><h3>Non-goals</h3><StringList items={project.nonGoals} /></section>
      <section className="doc-section" id="requirements"><h2>Requirements</h2><h3>Must-have</h3><StringList items={project.requirements.must} /><h3>Should-have</h3><StringList items={project.requirements.should} /><h3>Future scope</h3><StringList items={project.requirements.future} /><h3>Non-functional decisions</h3><div className="table-wrap"><table><thead><tr><th>Concern</th><th>Decision</th></tr></thead><tbody>{project.nfrs.map((item) => <tr key={item.concern}><td>{item.concern}</td><td>{item.decision}</td></tr>)}</tbody></table></div><h3>User roles</h3><div className="table-wrap"><table><thead><tr><th>Role</th><th>Access boundary</th></tr></thead><tbody>{project.roles.map((item) => <tr key={item.role}><td>{item.role}</td><td>{item.access}</td></tr>)}</tbody></table></div></section>
      <section className="doc-section" id="workflows"><h2>Core workflows</h2>{project.journeys.map((journey) => <div className="workflow" key={journey.name}><strong>{journey.name}</strong><div className="workflow-steps">{journey.steps.join(" → ")}</div></div>)}</section>
      <section className="doc-section" id="domain-model"><h2>Domain model</h2><div className="table-wrap"><table><thead><tr><th>Entities</th><th>Relationship</th></tr></thead><tbody>{project.entities.map((item) => <tr key={item.name}><td><code>{item.name}</code></td><td>{item.relationship}</td></tr>)}</tbody></table></div></section>
      <section className="doc-section" id="database"><h2>Database design</h2><p>PostgreSQL remains the transactional source of truth. Add specialized stores only for the workloads called out below.</p>{project.tables.map((table) => <div key={table.name}><h3><code>{table.name}</code> — {table.purpose}</h3><CopyBlock>{[table.name, "-".repeat(table.name.length), ...table.columns, "", `Constraints: ${table.constraints.join("; ")}`, `Indexes: ${table.indexes.join("; ")}`].join("\n")}</CopyBlock></div>)}<h3>Transaction and retention boundaries</h3><StringList items={project.transactions} /></section>
      <section className="doc-section" id="apis"><h2>API design</h2><CopyBlock>{apiText}</CopyBlock><div className="table-wrap"><table><thead><tr><th>Endpoint</th><th>Purpose and permission</th><th>Idempotency / status</th></tr></thead><tbody>{project.endpoints.map((item) => <tr key={`${item.method}${item.path}`}><td><code>{item.method} {item.path}</code></td><td>{item.purpose}<br /><span style={{ color: "var(--muted)" }}>{item.permission}</span></td><td>{item.idempotency ?? "Not required"}<br />{item.responses}</td></tr>)}</tbody></table></div><p className="note">List endpoints use opaque keyset cursors unless a small bounded collection is explicit. Unknown objects return 404 where 403 would leak existence.</p></section>
      <section className="doc-section" id="architecture"><h2>Architecture</h2><h3>System context</h3><MermaidDiagram chart={project.diagrams.context} label={`${project.title} system context`} /><h3>Main application architecture</h3><MermaidDiagram chart={project.diagrams.architecture} label={`${project.title} application architecture`} /><h3>Critical workflow sequence</h3><MermaidDiagram chart={project.diagrams.sequence} label={`${project.title} workflow sequence`} /></section>
      <section className="doc-section" id="events"><h2>Event model</h2><div className="table-wrap"><table><thead><tr><th>Event</th><th>Producer → consumers</th><th>Delivery</th></tr></thead><tbody>{project.events.map((event) => <tr key={event.name}><td><code>{event.name}</code></td><td>{event.producer} → {event.consumers}</td><td>{event.delivery}</td></tr>)}</tbody></table></div></section>
      <section className="doc-section" id="failures"><h2>Failure modes</h2>{project.failures.map((item) => <div className="failure" key={item.name}><h3>{item.name}</h3><p><strong>Failure</strong><br />{item.failure}</p><p><strong>Mitigation</strong><br />{item.mitigation}</p></div>)}</section>
      <section className="doc-section" id="consistency"><h2>Consistency and concurrency</h2><h3>Strong consistency / transactions</h3><StringList items={project.consistency.strong} /><h3>Eventual convergence</h3><StringList items={project.consistency.eventual} /><h3>Concurrency controls</h3><StringList items={project.concurrency} /></section>
      <section className="doc-section" id="caching-jobs"><h2>Caching and background work</h2><h3>Safe to cache</h3><StringList items={project.caching.cache} /><h3>Never a cache authority</h3><StringList items={project.caching.never} /><p className="note">{project.caching.policy}</p><h3>Background jobs</h3><StringList items={project.jobs} /></section>
      <section className="doc-section" id="security"><h2>Security boundaries</h2><p>Security claims here are design controls, not certification. Threat modeling and jurisdiction-specific review remain required.</p><StringList items={project.security} /></section>
      <section className="doc-section" id="observability"><h2>Observability</h2>{(["logs", "metrics", "traces", "alerts"] as const).map((kind) => <div key={kind}><h3>{kind[0].toUpperCase() + kind.slice(1)}</h3><StringList items={project.observability[kind]} /></div>)}</section>
      <section className="doc-section" id="testing"><h2>Testing strategy</h2><div className="table-wrap"><table><thead><tr><th>Layer</th><th>What it proves</th></tr></thead><tbody>{project.testing.map((item) => <tr key={item.layer}><td>{item.layer}</td><td>{item.coverage}</td></tr>)}</tbody></table></div><p className="note">Do not mock PostgreSQL constraints, transaction isolation, object-store semantics, or provider contract fixtures in the tests intended to prove those boundaries.</p></section>
      <section className="doc-section" id="deployment"><h2>Deployment evolution</h2>{project.deployment.map((stage) => <div className="workflow" key={stage.stage}><strong>{stage.stage}</strong><div>{stage.stack}</div></div>)}</section>
      <section className="doc-section" id="scaling"><h2>Scale evolution</h2><p>These are architecture scenarios, not throughput claims. Each transition should follow measured workload and reliability pressure.</p><div className="table-wrap"><table><thead><tr><th>Scenario</th><th>Architecture may evolve toward</th><th>Decision rule</th></tr></thead><tbody>{project.scale.map((stage) => <tr key={stage.users}><td>{stage.users}</td><td>{stage.architecture}</td><td>{stage.pressure}</td></tr>)}</tbody></table></div></section>
    </article>
    <aside className="rail"><div className="toc-label">System profile</div><div className="rail-row"><span>Primary DB</span><b>{project.primaryDb}</b></div><div className="rail-row"><span>Realtime</span><b>{project.realtime ? "Yes" : "No"}</b></div><div className="rail-row"><span>Queue</span><b>{project.queue ? "Yes" : "No"}</b></div><div className="rail-row"><span>Payments</span><b>{project.payments ? "Yes" : "No"}</b></div><div className="rail-row"><span>Multi-tenant</span><b>{project.multiTenancy ? "Yes" : "No"}</b></div></aside>
  </div>;
}

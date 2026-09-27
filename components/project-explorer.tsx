"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectMeta } from "@/lib/types";

export function ProjectExplorer({ projects }: { projects: ProjectMeta[] }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [concept, setConcept] = useState("all");
  const [capability, setCapability] = useState("all");
  const concepts = [...new Set(projects.flatMap((p) => p.topics))].sort();
  const filtered = projects.filter((project) => {
    const haystack = `${project.title} ${project.summary} ${project.topics.join(" ")}`.toLowerCase();
    const capabilityMatch = capability === "all" || (capability === "realtime" && project.realtime) || (capability === "payments" && project.payments) || (capability === "multiTenancy" && project.multiTenancy) || (capability === "eventDriven" && project.eventDriven);
    return haystack.includes(query.toLowerCase()) && (difficulty === "all" || project.difficulty === difficulty) && (concept === "all" || project.topics.includes(concept)) && capabilityMatch;
  });

  return <>
    <div className="filters" aria-label="Project filters">
      <input className="field" type="search" placeholder="Filter projects and concepts…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Filter projects" />
      <select className="field" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty"><option value="all">All difficulties</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option></select>
      <select className="field" value={concept} onChange={(e) => setConcept(e.target.value)} aria-label="Architecture concept"><option value="all">All concepts</option>{concepts.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="field" value={capability} onChange={(e) => setCapability(e.target.value)} aria-label="Capability"><option value="all">All capabilities</option><option value="realtime">Realtime</option><option value="payments">Payments</option><option value="multiTenancy">Multi-tenancy</option><option value="eventDriven">Event-driven</option></select>
    </div>
    {filtered.length ? <div className="project-grid">{filtered.map((project, index) => <Link className="project-card" href={`/projects/${project.slug}/`} key={project.slug}>
      <div className="card-kicker"><span>{String(index + 1).padStart(2, "0")} / Case study</span><span>{project.difficulty}</span></div>
      <h3>{project.title}</h3><p>{project.summary}</p>
      <dl className="card-facts"><div><dt>Database</dt><dd>{project.primaryDb}</dd></div><div><dt>System traits</dt><dd>{[project.realtime && "Realtime", project.queue && "Queue", project.payments && "Payments", project.multiTenancy && "Multi-tenant"].filter(Boolean).join(" · ") || "Transactional"}</dd></div></dl>
      <div className="meta-row">{project.topics.slice(0, 4).map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div>
    </Link>)}</div> : <div className="empty">No case studies match these filters.</div>}
  </>;
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";

function Column({ project, other }: { project: Project; other: Project }) {
  const unique = project.topics.filter((topic) => !other.topics.includes(topic));
  return <div className="compare-column"><div className="card-kicker"><span>{project.difficulty}</span><span>{project.primaryDb}</span></div><h2>{project.title}</h2><p>{project.summary}</p><h3>Distinct concerns</h3><div className="meta-row">{unique.length ? unique.map((x) => <span className="tag accent" key={x}>{x}</span>) : <span className="tag">Shared topic set</span>}</div><h3>Correctness boundary</h3><ul>{project.consistency.strong.slice(0, 4).map((x) => <li key={x}>{x}</li>)}</ul><h3>Characteristic failures</h3><ul>{project.failures.slice(0, 3).map((x) => <li key={x.name}><b>{x.name}:</b> {x.failure}</li>)}</ul><h3>At 1M+ scenario</h3><p>{project.scale[2].architecture}</p><Link className="text-link" href={`/projects/${project.slug}/`}>Open full case study →</Link></div>;
}
export function CompareClient({ projects }: { projects: Project[] }) {
  const [leftSlug, setLeft] = useState("food-delivery"); const [rightSlug, setRight] = useState("ride-hailing");
  const left = useMemo(() => projects.find((p) => p.slug === leftSlug)!, [projects, leftSlug]); const right = useMemo(() => projects.find((p) => p.slug === rightSlug)!, [projects, rightSlug]);
  const common = left.topics.filter((topic) => right.topics.includes(topic));
  return <><div className="compare-controls"><select className="field" value={leftSlug} onChange={(e) => setLeft(e.target.value)} aria-label="First project">{projects.map((p) => <option value={p.slug} disabled={p.slug === rightSlug} key={p.slug}>{p.title}</option>)}</select><select className="field" value={rightSlug} onChange={(e) => setRight(e.target.value)} aria-label="Second project">{projects.map((p) => <option value={p.slug} disabled={p.slug === leftSlug} key={p.slug}>{p.title}</option>)}</select></div><div className="workflow"><strong>Common architecture concepts</strong><div className="meta-row">{common.length ? common.map((x) => <span className="tag" key={x}>{x}</span>) : <span>No shared topic labels—the deeper constraints may still rhyme.</span>}</div></div><div className="compare-grid"><Column project={left} other={right} /><Column project={right} other={left} /></div></>;
}

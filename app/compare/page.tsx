import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { CompareClient } from "@/components/compare-client";

export const metadata: Metadata = { title: "Compare architectures", description: "Compare system-design constraints, consistency needs, failures, and scale paths." };
export default function ComparePage() { return <div className="shell search-page"><div className="eyebrow">Comparison mode</div><h1>Same tools. Different reasons.</h1><p className="hero-copy">Compare domain constraints rather than copying an architecture from one product category to another.</p><CompareClient projects={projects} /></div>; }

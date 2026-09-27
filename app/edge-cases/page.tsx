import type { Metadata } from "next";
import Link from "next/link";
import { edgeCases } from "@/content/edge-cases";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Distributed Systems Edge Cases", description: "A field guide to failures in payments, booking, uploads, realtime systems, multi-tenancy, and asynchronous work.", path: "/edge-cases/" });
export default function EdgeCasesPage() {
  const categories = [...new Set(edgeCases.map((item) => item.category))];
  return <div className="shell search-page"><div className="eyebrow">Failure field guide</div><h1>Edge cases are the curriculum.</h1><p className="hero-copy">Understand why a failure occurs, the bug it creates, and the architectural control that contains it.</p>{categories.map((category) => <section className="doc-section" key={category}><h2>{category}</h2>{edgeCases.filter((item) => item.category === category).map((item) => <Link className="result" href={`/edge-cases/${item.slug}/`} key={item.slug}><span className="result-type">{category}</span><span><h2>{item.title}</h2><p>{item.bug}</p></span></Link>)}</section>)}</div>;
}

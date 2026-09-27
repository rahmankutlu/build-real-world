"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export type SearchItem = { type: string; title: string; summary: string; href: string; text: string };
export function SearchClient({ index }: { index: SearchItem[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return index.slice(0, 12);
    return index.map((item) => ({ item, score: terms.reduce((score, term) => score + (item.title.toLowerCase().includes(term) ? 5 : 0) + (item.text.toLowerCase().includes(term) ? 1 : 0), 0) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).map((x) => x.item);
  }, [index, query]);
  return <><input autoFocus className="search-box" type="search" placeholder="Try “idempotency”, “double booking”, or “PostgreSQL”…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search all content" /><p style={{ color: "var(--muted)" }}>{results.length} {results.length === 1 ? "result" : "results"}</p><div>{results.map((item) => <Link className="result" href={item.href} key={`${item.type}-${item.href}`}><span className="result-type">{item.type}</span><span><h2>{item.title}</h2><p>{item.summary}</p></span></Link>)}</div></>;
}

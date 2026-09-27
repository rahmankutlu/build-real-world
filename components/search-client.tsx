"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type SearchItem = { type: string; title: string; summary: string; href: string; text: string };
function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, index) => terms.some((term) => part.toLowerCase() === term) ? <mark key={`${part}-${index}`}>{part}</mark> : part);
}
export function SearchClient({ index }: { index: SearchItem[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = !terms.length ? index.slice(0, 12) : index.map((item) => {
    const title = item.title.toLowerCase(); const summary = item.summary.toLowerCase(); const text = item.text.toLowerCase();
    return { item, score: terms.reduce((score, term) => score + (title === term ? 12 : title.includes(term) ? 7 : 0) + (summary.includes(term) ? 3 : 0) + (text.includes(term) ? 1 : 0), 0) };
  }).filter((result) => result.score >= terms.length).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).map((result) => result.item);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { const next = new URLSearchParams(window.location.search); if (query) next.set("q", query); else next.delete("q"); const search = next.toString(); window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}`); }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);
  return <><div className="search-input-wrap"><input ref={inputRef} autoFocus className="search-box" type="search" placeholder="Try “idempotency”, “double booking”, or “PostgreSQL”…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search all content" /><kbd>/</kbd></div><p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "result" : "results"}</p>{results.length ? <div>{results.map((item) => <Link className="result" href={item.href} key={`${item.type}-${item.href}`}><span className="result-type">{item.type}</span><span><h2>{highlight(item.title, terms)}</h2><p>{highlight(item.summary, terms)}</p></span></Link>)}</div> : <div className="empty"><strong>No matching engineering decision.</strong><br />Try a broader term such as “transaction”, “webhook”, “locking”, or “cache”.</div>}</>;
}

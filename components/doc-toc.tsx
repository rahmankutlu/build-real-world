"use client";

import { useEffect, useState } from "react";

export function DocToc({ sections, labels }: { sections: string[]; labels: Record<string, string> }) {
  const [active, setActive] = useState(sections[0]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-15% 0px -70%", threshold: [0, 1] });
    sections.forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [sections]);
  return <aside className="toc" aria-label="On this page"><div className="toc-label">On this page</div>{sections.map((id) => <a className={active === id ? "active" : undefined} aria-current={active === id ? "location" : undefined} href={`#${id}`} key={id}>{labels[id]}</a>)}</aside>;
}

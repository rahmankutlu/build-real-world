"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ chart, label }: { chart: string; label: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: document.documentElement.dataset.theme === "dark" ? "dark" : "neutral", fontFamily: "ui-sans-serif, system-ui" });
      try {
        const id = `mermaid-${reactId.replace(/:/g, "")}`;
        const rendered = await mermaid.render(id, chart);
        if (active) setSvg(rendered.svg);
      } catch { if (active) setError(true); }
    });
    return () => { active = false; };
  }, [chart, reactId]);
  return <div className="diagram" role="img" aria-label={label}>{error ? <pre>{chart}</pre> : svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : "Rendering diagram…"}</div>;
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({ chart, label }: { chart: string; label: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [themeRevision, setThemeRevision] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const rerender = () => setThemeRevision((value) => value + 1); window.addEventListener("themechange", rerender); return () => window.removeEventListener("themechange", rerender); }, []);
  useEffect(() => {
    let active = true;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: document.documentElement.dataset.theme === "dark" ? "dark" : "neutral", fontFamily: "ui-sans-serif, system-ui" });
      try {
        const id = `mermaid-${reactId.replace(/:/g, "")}-${themeRevision}`;
        const rendered = await mermaid.render(id, chart);
        if (active) setSvg(rendered.svg);
      } catch { if (active) setError(true); }
    });
    return () => { active = false; };
  }, [chart, reactId, themeRevision]);
  return <figure className="diagram-frame"><figcaption>{label}<button className="diagram-expand" type="button" onClick={() => dialogRef.current?.showModal()}>Enlarge</button></figcaption><div className="diagram" role="img" aria-label={label}>{error ? <pre>{chart}</pre> : svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : "Rendering diagram…"}</div><dialog className="diagram-dialog" ref={dialogRef} aria-label={`Enlarged ${label}`}><div className="dialog-bar"><strong>{label}</strong><button type="button" onClick={() => dialogRef.current?.close()}>Close</button></div>{svg ? <div className="diagram enlarged" dangerouslySetInnerHTML={{ __html: svg }} /> : null}</dialog></figure>;
}

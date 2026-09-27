"use client";

import { useEffect, useId, useRef, useState } from "react";

type DiagramTheme = "dark" | "neutral";
type RenderState =
  | { status: "rendering"; svg: ""; theme?: undefined }
  | { status: "rendered"; svg: string; theme: DiagramTheme }
  | { status: "error"; svg: ""; theme?: undefined };

let mermaidPromise: Promise<(typeof import("mermaid"))["default"]> | undefined;
let renderQueue = Promise.resolve();
let initializedTheme: DiagramTheme | undefined;

function removeRenderArtifacts(id: string, container: HTMLElement) {
  container.replaceChildren();
  for (const artifactId of [id, `d${id}`, `i${id}`]) {
    document.getElementById(artifactId)?.remove();
  }
}

function renderMermaid(
  chart: string,
  id: string,
  theme: DiagramTheme,
  container: HTMLElement,
  signal: AbortSignal,
) {
  const render = renderQueue.then(async () => {
    if (signal.aborted) throw new DOMException("Render cancelled", "AbortError");

    mermaidPromise ??= import("mermaid").then(
      ({ default: mermaid }) => mermaid,
      (error: unknown) => {
        // Allow a later render to retry a transient chunk-load failure.
        mermaidPromise = undefined;
        throw error;
      },
    );
    const mermaid = await mermaidPromise;

    if (initializedTheme !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme,
        fontFamily: "ui-sans-serif, system-ui",
      });
      initializedTheme = theme;
    }

    await mermaid.parse(chart);
    if (signal.aborted) throw new DOMException("Render cancelled", "AbortError");

    try {
      const { svg } = await mermaid.render(id, chart, container);
      if (signal.aborted) throw new DOMException("Render cancelled", "AbortError");
      return svg;
    } finally {
      removeRenderArtifacts(id, container);
    }
  });

  renderQueue = render.then(() => undefined, () => undefined);
  return render;
}

export function MermaidDiagram({ chart, label }: { chart: string; label: string }) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [renderState, setRenderState] = useState<RenderState>({ status: "rendering", svg: "" });
  const [themeRevision, setThemeRevision] = useState(0);
  const renderAttempt = useRef(0);
  const renderHostRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const rerender = () => setThemeRevision((value) => value + 1);
    window.addEventListener("themechange", rerender);
    return () => window.removeEventListener("themechange", rerender);
  }, []);

  useEffect(() => {
    const container = renderHostRef.current;
    if (!container) return;

    const controller = new AbortController();
    const id = `mermaid-${reactId}-${themeRevision}-${++renderAttempt.current}`;
    const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "neutral";
    setRenderState({ status: "rendering", svg: "" });
    removeRenderArtifacts(id, container);

    renderMermaid(chart, id, theme, container, controller.signal).then(
      (svg) => {
        if (!controller.signal.aborted) setRenderState({ status: "rendered", svg, theme });
      },
      () => {
        removeRenderArtifacts(id, container);
        if (!controller.signal.aborted) setRenderState({ status: "error", svg: "" });
      },
    );

    return () => {
      controller.abort();
      removeRenderArtifacts(id, container);
    };
  }, [chart, reactId, themeRevision]);

  const rendered = renderState.status === "rendered";

  return (
    <figure
      className="diagram-frame"
      data-diagram-state={renderState.status}
      data-diagram-theme={rendered ? renderState.theme : undefined}
    >
      <figcaption>
        {label}
        <button
          className="diagram-expand"
          type="button"
          disabled={!rendered}
          onClick={() => dialogRef.current?.showModal()}
        >
          Enlarge
        </button>
      </figcaption>
      <div className="diagram" role="img" aria-label={label}>
        {renderState.status === "error" ? (
          <p className="diagram-error" role="status">Diagram unavailable.</p>
        ) : rendered ? (
          <div dangerouslySetInnerHTML={{ __html: renderState.svg }} />
        ) : (
          <span className="diagram-loading">Rendering diagram…</span>
        )}
      </div>
      <div ref={renderHostRef} className="mermaid-render-host" aria-hidden="true" />
      <dialog className="diagram-dialog" ref={dialogRef} aria-label={`Enlarged ${label}`}>
        <div className="dialog-bar">
          <strong>{label}</strong>
          <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
        </div>
        {rendered ? (
          <div className="diagram enlarged" dangerouslySetInnerHTML={{ __html: renderState.svg }} />
        ) : null}
      </dialog>
    </figure>
  );
}

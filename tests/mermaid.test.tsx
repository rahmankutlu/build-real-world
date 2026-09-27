import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { projects } from "@/content/projects";

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({ default: mermaidMock }));

async function loadComponent() {
  vi.resetModules();
  return (await import("@/components/mermaid-diagram")).MermaidDiagram;
}

async function loadRealMermaid() {
  return (await vi.importActual<typeof import("mermaid")>("mermaid")).default;
}

function leakErrorNodes(id: string) {
  const wrapper = document.createElement("div");
  wrapper.id = `d${id}`;
  wrapper.innerHTML = `<svg id="${id}"><text>Syntax error in text</text><text>mermaid version 11.17.2</text></svg>`;
  document.body.append(wrapper);
}

describe("project Mermaid diagrams", () => {
  const charts = projects.flatMap((project) =>
    Object.entries(project.diagrams).map(([kind, chart]) => ({ name: `${project.slug}/${kind}`, chart })),
  );

  it("covers all 30 project diagrams", () => {
    expect(projects).toHaveLength(10);
    expect(charts).toHaveLength(30);
  });

  it.each(charts)("parses $name with the pinned Mermaid", async ({ chart }) => {
    const mermaid = await loadRealMermaid();
    await expect(mermaid.parse(chart)).resolves.toBeTruthy();
  });

  it("rejects semicolons inside sequence messages, the cause of the production failure", async () => {
    const mermaid = await loadRealMermaid();
    await expect(
      mermaid.parse("sequenceDiagram\nAPI->>PostgreSQL: lock stock; create reservation\nAPI-->>Customer: ok"),
    ).rejects.toThrow(/Parse error/);
  });

  it.each(["ecommerce", "payment-platform"])("keeps %s sequence messages free of statement separators", (slug) => {
    const project = projects.find((candidate) => candidate.slug === slug);
    expect(project).toBeDefined();
    for (const line of project!.diagrams.sequence.split("\n")) {
      expect(line).not.toMatch(/:\s.*;/);
    }
  });
});

describe("MermaidDiagram", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
    mermaidMock.initialize.mockReset();
    mermaidMock.parse.mockReset().mockResolvedValue({ diagramType: "flowchart-v2" });
    mermaidMock.render.mockReset().mockImplementation(async (id: string) => ({
      svg: `<svg data-rendered-id="${id}"><text>ok</text></svg>`,
    }));
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders the SVG and enables enlarging only once rendered", async () => {
    const MermaidDiagram = await loadComponent();
    const { container } = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} label="Demo system context" />);

    expect(screen.getByRole("button", { name: "Enlarge" })).toBeDisabled();
    await waitFor(() => expect(container.querySelector("figure")).toHaveAttribute("data-diagram-state", "rendered"));

    expect(container.querySelector("figure")).toHaveAttribute("data-diagram-theme", "neutral");
    expect(container.querySelector(":scope figure > .diagram svg")).not.toBeNull();
    expect(container.querySelector(".diagram-dialog .diagram svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Enlarge" })).toBeEnabled();
    expect(mermaidMock.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: "strict", suppressErrorRendering: true, theme: "neutral" }),
    );
    expect(mermaidMock.render).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-/),
      "flowchart LR\nA --> B",
      container.querySelector(".mermaid-render-host"),
    );
  });

  it("shows a neutral fallback and removes leaked Mermaid error DOM when rendering fails", async () => {
    mermaidMock.render.mockImplementation(async (id: string) => {
      leakErrorNodes(id);
      throw new Error("Parse error on line 3");
    });
    const MermaidDiagram = await loadComponent();
    const { container } = render(<MermaidDiagram chart={"sequenceDiagram\nbroken"} label="Broken sequence" />);

    await waitFor(() => expect(container.querySelector("figure")).toHaveAttribute("data-diagram-state", "error"));

    expect(screen.getByText("Diagram unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enlarge" })).toBeDisabled();
    expect(document.body).not.toHaveTextContent("Syntax error in text");
    expect(document.querySelectorAll('[id^="mermaid-"], [id^="dmermaid-"], [id^="imermaid-"]')).toHaveLength(0);
    expect(container.querySelector(".mermaid-render-host")?.childElementCount).toBe(0);
  });

  it("shows the fallback without rendering when parsing fails", async () => {
    mermaidMock.parse.mockRejectedValue(new Error("Parse error"));
    const MermaidDiagram = await loadComponent();
    const { container } = render(<MermaidDiagram chart={"sequenceDiagram\nbroken"} label="Broken sequence" />);

    await waitFor(() => expect(container.querySelector("figure")).toHaveAttribute("data-diagram-state", "error"));
    expect(mermaidMock.render).not.toHaveBeenCalled();
    expect(document.body).not.toHaveTextContent("Syntax error in text");
  });

  it("rerenders with the dark Mermaid theme after a theme change", async () => {
    const MermaidDiagram = await loadComponent();
    const { container } = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} label="Themed" />);
    const figure = () => container.querySelector("figure");
    await waitFor(() => expect(figure()).toHaveAttribute("data-diagram-theme", "neutral"));

    act(() => {
      document.documentElement.dataset.theme = "dark";
      window.dispatchEvent(new Event("themechange"));
    });

    await waitFor(() => expect(figure()).toHaveAttribute("data-diagram-theme", "dark"));
    expect(figure()).toHaveAttribute("data-diagram-state", "rendered");
    expect(mermaidMock.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: "dark" }));
    const ids = mermaidMock.render.mock.calls.map(([id]) => id as string);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("serializes renders so concurrent diagrams never interleave Mermaid calls", async () => {
    let active = 0;
    let maxActive = 0;
    mermaidMock.render.mockImplementation(async (id: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { svg: `<svg data-rendered-id="${id}"></svg>` };
    });
    const MermaidDiagram = await loadComponent();
    const { container } = render(
      <>
        <MermaidDiagram chart={"flowchart LR\nA --> B"} label="One" />
        <MermaidDiagram chart={"flowchart LR\nB --> C"} label="Two" />
        <MermaidDiagram chart={"sequenceDiagram\nA->>B: hi"} label="Three" />
      </>,
    );

    await waitFor(() => expect(container.querySelectorAll('[data-diagram-state="rendered"]')).toHaveLength(3));
    expect(maxActive).toBe(1);
  });

  it("does not apply or leak a render that finishes after unmount", async () => {
    let finish: (value: { svg: string }) => void = () => {};
    mermaidMock.render.mockImplementation((id: string) => {
      leakErrorNodes(id);
      return new Promise((resolve) => { finish = resolve; });
    });
    const MermaidDiagram = await loadComponent();
    const { unmount } = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} label="Unmounted" />);
    await waitFor(() => expect(mermaidMock.render).toHaveBeenCalled());

    unmount();
    await act(async () => { finish({ svg: "<svg></svg>" }); });

    expect(document.querySelectorAll('[id^="mermaid-"], [id^="dmermaid-"], [id^="imermaid-"]')).toHaveLength(0);
  });
});

describe("MermaidDiagram chunk loading", () => {
  afterEach(() => {
    cleanup();
    vi.doUnmock("mermaid");
  });

  it("retries the Mermaid import after a transient chunk-load failure", async () => {
    let attempts = 0;
    vi.resetModules();
    vi.doMock("mermaid", () => {
      attempts += 1;
      if (attempts === 1) throw new Error("ChunkLoadError");
      return { default: mermaidMock };
    });
    mermaidMock.parse.mockReset().mockResolvedValue({ diagramType: "flowchart-v2" });
    mermaidMock.render.mockReset().mockResolvedValue({ svg: "<svg></svg>" });
    const { MermaidDiagram } = await import("@/components/mermaid-diagram");

    const first = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} label="First" />);
    await waitFor(() => expect(first.container.querySelector("figure")).toHaveAttribute("data-diagram-state", "error"));
    first.unmount();

    const second = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} label="Second" />);
    await waitFor(() => expect(second.container.querySelector("figure")).toHaveAttribute("data-diagram-state", "rendered"));
    expect(attempts).toBe(2);
  });
});

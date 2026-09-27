import type { Project } from "@/lib/types";

export function diagrams(nodes: string, architecture: string, sequence: string): Project["diagrams"] {
  return { context: `flowchart LR\n${nodes}`, architecture: `flowchart TB\n${architecture}`, sequence: `sequenceDiagram\n${sequence}` };
}

type ScaleStage = [architecture: string, decisionRule: string];

export function scale(stages: { start: ScaleStage; middle: ScaleStage; large: ScaleStage }): Project["scale"] {
  return [
    { users: "1K users", architecture: stages.start[0], pressure: stages.start[1] },
    { users: "100K users", architecture: stages.middle[0], pressure: stages.middle[1] },
    { users: "1M+ users", architecture: stages.large[0], pressure: stages.large[1] },
  ];
}

import type { Project } from "@/lib/types";

export function diagrams(nodes: string, architecture: string, sequence: string): Project["diagrams"] {
  return { context: `flowchart LR\n${nodes}`, architecture: `flowchart LR\n${architecture}`, sequence: `sequenceDiagram\n${sequence}` };
}

export const scale = (middle: string, large: string): Project["scale"] => [
  { users: "1K users", architecture: "One stateless application, PostgreSQL, a worker, managed object storage where needed", pressure: "Optimize for operability; measure before splitting services" },
  { users: "100K users", architecture: middle, pressure: "Add replicas, queues, and caches only around measured contention or latency" },
  { users: "1M+ users", architecture: large, pressure: "Partition along explicit domain or data ownership boundaries; preserve correctness invariants" },
];

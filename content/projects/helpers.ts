import type { Project } from "@/lib/types";

export function diagrams(nodes: string, architecture: string, sequence: string): Project["diagrams"] {
  return { context: `flowchart LR\n${nodes}`, architecture: `flowchart LR\n${architecture}`, sequence: `sequenceDiagram\n${sequence}` };
}

export const baseObservability = (domainMetric: string): Project["observability"] => ({
  logs: ["Structured request log with request_id, actor_id, result, and latency; never secrets or sensitive payloads", "State transitions with entity id, previous state, new state, and reason", "Worker attempt, event id, retry count, and terminal outcome"],
  metrics: ["Request rate, error rate, and p50/p95/p99 latency by route", "Queue age and depth, worker failure rate, and dead-letter count", domainMetric],
  traces: ["Propagate trace context from API through database, queue publish, workers, and external dependencies"],
  alerts: ["Sustained user-visible error-budget burn", "Oldest queue message exceeds the workflow SLO", `Material deviation in ${domainMetric.toLowerCase()}`],
});

export const scale = (middle: string, large: string): Project["scale"] => [
  { users: "1K users", architecture: "One stateless application, PostgreSQL, a worker, managed object storage where needed", pressure: "Optimize for operability; measure before splitting services" },
  { users: "100K users", architecture: middle, pressure: "Add replicas, queues, and caches only around measured contention or latency" },
  { users: "1M+ users", architecture: large, pressure: "Partition along explicit domain or data ownership boundaries; preserve correctness invariants" },
];

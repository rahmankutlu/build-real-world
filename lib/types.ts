export const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
export type Difficulty = (typeof difficulties)[number];

export type ProjectMeta = {
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  primaryDb: string;
  realtime: boolean;
  queue: boolean;
  payments: boolean;
  multiTenancy: boolean;
  eventDriven: boolean;
  topics: string[];
  actors: string[];
  featured: boolean;
};

export type Table = {
  name: string;
  purpose: string;
  columns: string[];
  constraints: string[];
  indexes: string[];
};

export type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
  permission: string;
  idempotency?: string;
  responses: string;
};

export type Failure = { name: string; failure: string; mitigation: string };
export type ScaleStage = { users: string; architecture: string; pressure: string };

export type Project = ProjectMeta & {
  purpose: string;
  assumptions: string[];
  nonGoals: string[];
  journeys: { name: string; steps: string[] }[];
  requirements: { must: string[]; should: string[]; future: string[] };
  nfrs: { concern: string; decision: string }[];
  roles: { role: string; access: string }[];
  entities: { name: string; relationship: string }[];
  tables: Table[];
  transactions: string[];
  endpoints: Endpoint[];
  events: { name: string; producer: string; consumers: string; delivery: string }[];
  failures: Failure[];
  consistency: { strong: string[]; eventual: string[] };
  concurrency: string[];
  caching: { cache: string[]; never: string[]; policy: string };
  jobs: string[];
  security: string[];
  observability: { logs: string[]; metrics: string[]; traces: string[]; alerts: string[] };
  testing: { layer: string; coverage: string }[];
  deployment: { stage: string; stack: string }[];
  scale: ScaleStage[];
  diagrams: { context: string; architecture: string; sequence: string };
};

export type Pattern = {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  useWhen: string[];
  avoidWhen: string[];
  example: string;
  tradeoffs: string[];
};

export type EdgeCase = {
  slug: string;
  title: string;
  category: string;
  why: string;
  bug: string;
  mitigation: string;
  projects: string[];
};

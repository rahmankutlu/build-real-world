import type { Project } from "@/lib/types";
import meta from "./metadata.json";
import { baseObservability, diagrams, scale } from "../helpers";

const project: Project = {
  ...meta, difficulty: "Expert",
  purpose: "Match riders with eligible nearby drivers, maintain a trustworthy trip state machine, and price and settle completed transportation under high location churn.",
  assumptions: ["Drivers are independently available or unavailable", "A maps provider supplies routes", "Pricing rules are versioned", "Safety and licensing obligations vary by jurisdiction"],
  nonGoals: ["Autonomous driving", "Building maps", "Replicating any proprietary dispatch algorithm", "Cash handling"],
  journeys: [
    { name: "Request ride", steps: ["Validate pickup/drop-off", "Create expiring quote", "Authorize payment method", "Create requested trip", "Find eligible drivers", "Issue staged offers", "Atomically assign first winner"] },
    { name: "Take trip", steps: ["Driver arrives", "Rider verifies trip PIN where required", "Start trip", "Stream coarse progress", "Complete at actual destination", "Calculate final fare", "Capture and settle"] },
  ],
  requirements: { must: ["Driver availability and location ingestion", "Expiring fare quote", "Race-safe matching", "Ordered trip transitions", "Final fare and receipt"], should: ["Scheduled rides", "Safety escalation", "Driver destination filters", "Cancellation fees"], future: ["Shared rides", "Multi-region roaming", "Fleet accounts", "Demand prediction"] },
  nfrs: [
    { concern: "Latency", decision: "Candidate lookup and offer delivery are interactive; final settlement can converge asynchronously." },
    { concern: "Consistency", decision: "A trip has one assigned driver and ordered states. Location, ETA, and heat maps are eventual." },
    { concern: "Availability", decision: "Never create ambiguous assignment to improve availability; degrade maps and pricing explicitly." },
    { concern: "Privacy", decision: "Exact trip location is purpose-limited, access-logged, and retained according to policy." },
    { concern: "Auditability", decision: "Price rule/version, route inputs, safety access, and manual changes are preserved." },
  ],
  roles: [{ role: "Rider", access: "Own quotes, trips, receipts" }, { role: "Driver", access: "Own availability, offers, assigned trips, earnings" }, { role: "Safety operator", access: "Break-glass trip access with immutable audit" }, { role: "Support", access: "Masked trip and payment view; scoped adjustments" }],
  entities: [{ name: "Driver → DriverStatus", relationship: "Availability is durable; positions are ephemeral" }, { name: "RideQuote → PricingVersion", relationship: "Quote fixes inputs and expiry" }, { name: "Trip → DriverOffer", relationship: "Many offers, no more than one winner" }, { name: "Trip → Fare", relationship: "Final fare records components and quote relationship" }, { name: "Trip → SafetyIncident", relationship: "Restricted incident record and audit trail" }],
  tables: [
    { name: "trips", purpose: "Authoritative ride workflow", columns: ["id UUID PK", "rider_id UUID FK", "driver_id UUID FK NULL", "status TEXT", "pickup GEOGRAPHY", "dropoff GEOGRAPHY", "quote_id UUID FK", "version INT"], constraints: ["one active assignment per trip", "valid status check"], indexes: ["(rider_id, created_at DESC)", "(driver_id, status)"] },
    { name: "driver_status", purpose: "Durable eligibility state", columns: ["driver_id UUID PK", "state TEXT", "vehicle_id UUID FK", "region_id UUID", "version INT"], constraints: ["one state per driver"], indexes: ["(region_id, state)"] },
    { name: "ride_quotes", purpose: "Expiring price promise", columns: ["id UUID PK", "rider_id UUID FK", "pricing_version TEXT", "amount_minor BIGINT", "currency CHAR(3)", "expires_at TIMESTAMPTZ", "route_hash TEXT"], constraints: ["amount_minor >= 0"], indexes: ["(rider_id, expires_at)"] },
    { name: "driver_offers", purpose: "Dispatch attempts", columns: ["id UUID PK", "trip_id UUID FK", "driver_id UUID FK", "status TEXT", "expires_at TIMESTAMPTZ"], constraints: ["UNIQUE(trip_id, driver_id)"], indexes: ["(driver_id, status, expires_at)"] },
  ],
  transactions: ["Accept offer by locking/conditionally updating both trip and driver availability", "Trip transition plus outbox is atomic", "Final fare record and balanced earnings entries share a commit", "Ephemeral raw locations expire; financial/trip audit records use retention states, not ad-hoc delete"],
  endpoints: [
    { method: "POST", path: "/v1/ride-quotes", purpose: "Price a route with an expiry", permission: "Rider", responses: "201, 422, 503" },
    { method: "POST", path: "/v1/trips", purpose: "Request a ride from a quote", permission: "Rider", idempotency: "Required", responses: "201, 409, 422" },
    { method: "POST", path: "/v1/driver-offers/:id/accept", purpose: "Attempt trip assignment", permission: "Offer recipient", idempotency: "Required", responses: "200, 409, 410" },
    { method: "PATCH", path: "/v1/trips/:id/status", purpose: "Advance allowed state with version", permission: "Assigned driver or restricted operator", idempotency: "Transition id", responses: "200, 409, 422" },
    { method: "POST", path: "/v1/drivers/me/locations", purpose: "Ingest sequenced location batch", permission: "Authenticated eligible driver", responses: "202, 400, 429" },
    { method: "GET", path: "/v1/trips/:id", purpose: "Read authorized trip projection", permission: "Trip rider/driver or audited staff", responses: "200, 403, 404" },
  ],
  events: [{ name: "TripRequested", producer: "Trip API", consumers: "Matcher", delivery: "Outbox; matcher deduplicates trip/version" }, { name: "DriverAssigned", producer: "Matcher", consumers: "Realtime, notifications", delivery: "At-least-once; versioned projection" }, { name: "TripCompleted", producer: "Trip API", consumers: "Fare, settlement, safety analytics", delivery: "Inbox dedupe; settlement dead-letter is operationally visible" }],
  failures: [
    { name: "Acceptance race", failure: "Two drivers accept near-simultaneously.", mitigation: "Conditional trip and driver updates in one transaction; only committed winner succeeds." },
    { name: "Stale location", failure: "Nearest candidate is no longer nearby.", mitigation: "Filter by sample age, show offer expiry, and expand search rings." },
    { name: "Out-of-order GPS", failure: "Mobile batches arrive late.", mitigation: "Per-device sequence/timestamp rejects older live projection while retaining bounded telemetry." },
    { name: "Completion timeout", failure: "Trip completes but response is lost.", mitigation: "Transition id returns stored outcome; fare creation is unique per trip." },
    { name: "Maps outage", failure: "No route or ETA is available.", mitigation: "Stop new quotes or use clearly bounded fallback policy; active trips remain operable." },
    { name: "Driver disappears", failure: "Assigned driver goes offline before pickup.", mitigation: "Heartbeat timeout marks attention-needed; safe reassignment uses explicit cancellation transition." },
  ],
  consistency: { strong: ["One trip-driver assignment", "Driver cannot hold incompatible active trips", "State ordering", "Fare and earnings"], eventual: ["Position", "ETA", "supply heat map", "notifications"] },
  concurrency: ["Trip assignment is a database compare-and-set, not a distributed lock", "Lock trip then driver in stable order", "Unique active-trip constraint protects driver eligibility", "Monotonic location sequence controls reordering"],
  caching: { cache: ["Map tiles", "Pricing configuration by version", "Coarse supply heat map"], never: ["Assignment winner", "Current trip state for writes", "Safety authorization"], policy: "Versioned config is long-lived; heat maps use seconds-long TTL. Live reads include freshness and writes always hit the owner." },
  jobs: ["Expire quotes/offers", "Expand match radius", "Detect missing heartbeats", "Calculate fare", "Reconcile capture", "Apply location retention"],
  security: ["Trip object authorization for rider and assigned driver", "Short-lived scoped driver device tokens", "Minimize exact location exposure and audit staff access", "Server-verifiable state transitions and anti-spoofing signals", "Rate limits on location and ride requests", "Signed payment webhooks and hosted tokenization", "Step-up access for safety tooling"],
  observability: baseObservability("match time, offer acceptance, stale-driver rate, and unassigned-trip age"),
  testing: [{ layer: "Unit", coverage: "Trip state machine, quote expiry, pricing rules, sequence handling" }, { layer: "Integration", coverage: "PostGIS lookup, atomic assignment, outbox, fare uniqueness" }, { layer: "Contract", coverage: "Map/payment adapters and mobile event versions" }, { layer: "Concurrency", coverage: "Driver/trip cross-races and duplicate transitions" }, { layer: "Failure", coverage: "Offline devices, delayed GPS, map timeout, capture ambiguity" }, { layer: "Load", coverage: "Geographically skewed location writes and stadium dispatch burst" }],
  deployment: [{ stage: "Stage 1", stack: "Modular API, PostgreSQL/PostGIS, Redis ephemeral geo index, queue, realtime gateway" }, { stage: "Stage 2", stack: "Dedicated location ingestion and matching workers by city; API replicas; analytical stream" }, { stage: "Stage 3", stack: "Region-owned trip/matching cells with controlled roaming; separate financial ledger boundary" }],
  scale: scale("Separate high-write location path; shard matcher by city/geocell; keep trip writes on PostgreSQL owner", "Regional cells own matching and trips; event streams feed cross-region analytics without making them assignment authorities"),
  diagrams: diagrams("Rider --> Platform\nDriver --> Platform\nSafetyTeam --> Platform\nPlatform --> Maps\nPlatform --> PaymentProvider", "MobileApps --> API\nDriverApp --> LocationIngest\nLocationIngest --> GeoIndex\nAPI --> PostgreSQL\nPostgreSQL --> Queue\nQueue --> Matcher\nMatcher --> RealtimeGateway", "Rider->>API: POST /trips(quote)\nAPI->>PostgreSQL: trip requested + outbox\nMatcher->>GeoIndex: eligible nearby drivers\nMatcher-->>DriverA: offer\nMatcher-->>DriverB: offer\nDriverA->>API: accept\nAPI->>PostgreSQL: CAS trip unassigned -> DriverA\nDriverB->>API: accept\nAPI-->>DriverB: 409 already assigned"),
};
export default project;

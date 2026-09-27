import type { Project } from "@/lib/types";
import meta from "./metadata.json";
import { baseObservability, diagrams, scale } from "../helpers";

const project: Project = {
  ...meta,
  difficulty: "Expert",
  purpose: "Move a prepared meal from an independently operated restaurant to a customer while coordinating volatile menus, preparation, courier dispatch, location, payment, and support.",
  assumptions: ["Restaurants control opening state and item availability", "Couriers opt into offers", "Location updates are approximate and short-lived", "Example workload: a city may see 200 active deliveries, purely for design discussion"],
  nonGoals: ["Owning restaurant POS systems", "Guaranteeing exact ETAs", "Autonomous routing", "Storing raw card data"],
  journeys: [
    { name: "Place order", steps: ["Resolve delivery address and service zone", "Fetch menu version", "Validate items and restaurant state", "Calculate quote", "Authorize payment", "Create order", "Ask restaurant to accept", "Start dispatch after acceptance"] },
    { name: "Dispatch", steps: ["Select nearby eligible couriers", "Create short-lived offers", "First valid acceptance wins", "Notify losers", "Stream pickup route", "Reassign on timeout or rejection"] },
    { name: "Complete delivery", steps: ["Courier confirms pickup", "Location updates feed customer projection", "Courier supplies proof of delivery", "Capture/settle payment", "Calculate courier and restaurant payable"] },
  ],
  requirements: { must: ["Discover open restaurants in a service zone", "Order against a versioned menu", "Restaurant accept/reject workflow", "Offer and assign a courier atomically", "Track active delivery and settle participants"], should: ["Scheduled orders", "Substitutions", "Customer-courier masked chat", "Operational dispatch console"], future: ["Batch deliveries", "Restaurant POS adapters", "Demand forecasting", "Multi-stop routing"] },
  nfrs: [
    { concern: "Availability", decision: "Browse may serve slightly stale data; accepting orders and assignments fail closed when ownership cannot be established." },
    { concern: "Latency", decision: "Dispatch candidates and location fan-out are latency-sensitive; settlement is asynchronous." },
    { concern: "Consistency", decision: "Order state and courier assignment require conditional transitions; map position and ETA are eventual." },
    { concern: "Privacy", decision: "Precise courier/customer locations are retained briefly and exposed only during an active delivery." },
    { concern: "Auditability", decision: "Every manual reassignment, refund, and state override records actor and reason." },
  ],
  roles: [
    { role: "Customer", access: "Own orders and active courier tracking" },
    { role: "Restaurant staff", access: "Only their restaurant's menu and incoming orders" },
    { role: "Courier", access: "Own offers, active job, and minimum pickup/drop-off details" },
    { role: "Dispatcher/support", access: "Region-scoped operations; sensitive actions audited" },
  ],
  entities: [
    { name: "Restaurant → Menu → MenuItem", relationship: "A published menu version is priced at order time" },
    { name: "Order → OrderLine", relationship: "Order stores immutable names, modifiers, taxes, and prices" },
    { name: "Order → Delivery", relationship: "Accepted order creates one delivery state machine" },
    { name: "Delivery → CourierOffer", relationship: "Many offers may exist; at most one can win" },
    { name: "Courier → LocationSample", relationship: "Ephemeral time-series data, not the operational source of truth" },
  ],
  tables: [
    { name: "restaurants", purpose: "Merchant and service state", columns: ["id UUID PK", "name TEXT", "status TEXT", "service_area GEOGRAPHY", "timezone TEXT", "menu_version BIGINT"], constraints: ["valid timezone", "status enum check"], indexes: ["GIST(service_area) for address containment", "(status)"] },
    { name: "orders", purpose: "Commercial and kitchen workflow", columns: ["id UUID PK", "customer_id UUID FK", "restaurant_id UUID FK", "status TEXT", "menu_version BIGINT", "total_minor BIGINT", "delivery_address JSONB", "version INT"], constraints: ["total_minor >= 0"], indexes: ["(restaurant_id, status, created_at)", "(customer_id, created_at DESC)"] },
    { name: "deliveries", purpose: "Pickup/drop-off state and winner", columns: ["id UUID PK", "order_id UUID FK UNIQUE", "courier_id UUID FK NULL", "status TEXT", "pickup_by TIMESTAMPTZ", "version INT"], constraints: ["UNIQUE(order_id)"], indexes: ["(courier_id, status)", "(status, pickup_by)"] },
    { name: "courier_offers", purpose: "Expiring dispatch proposals", columns: ["id UUID PK", "delivery_id UUID FK", "courier_id UUID FK", "status TEXT", "expires_at TIMESTAMPTZ"], constraints: ["UNIQUE(delivery_id, courier_id)"], indexes: ["(courier_id, status, expires_at)"] },
    { name: "ledger_entries", purpose: "Immutable order settlement components", columns: ["id UUID PK", "order_id UUID FK", "account_ref TEXT", "amount_minor BIGINT", "currency CHAR(3)", "entry_type TEXT"], constraints: ["amount_minor <> 0", "UNIQUE(order_id, account_ref, entry_type)"], indexes: ["(account_ref, id)"] },
  ],
  transactions: ["Create order snapshot and outbox after authorization result is known", "Courier acceptance conditionally updates offer and delivery where courier_id IS NULL; database winner decides", "Delivery completion and balanced settlement entries commit together", "Location history uses retention deletion; orders and settlement are immutable/audited"],
  endpoints: [
    { method: "GET", path: "/v1/restaurants?lat=…&lng=…&cursor=…", purpose: "Discover serviceable open restaurants", permission: "Public with rate limits", responses: "200, 400" },
    { method: "POST", path: "/v1/orders/quote", purpose: "Return expiring server-calculated quote", permission: "Customer", responses: "200, 409, 422" },
    { method: "POST", path: "/v1/orders", purpose: "Authorize and place order", permission: "Customer", idempotency: "Required", responses: "201, 202, 402, 409" },
    { method: "POST", path: "/v1/restaurant-orders/:id/accept", purpose: "Accept with promised preparation time", permission: "Restaurant staff for owning restaurant", idempotency: "State transition is idempotent", responses: "200, 409" },
    { method: "POST", path: "/v1/courier-offers/:id/accept", purpose: "Attempt to win delivery assignment", permission: "Offer recipient", idempotency: "Required; atomic winner check", responses: "200, 409, 410" },
    { method: "PATCH", path: "/v1/deliveries/:id/status", purpose: "Advance permitted delivery state", permission: "Assigned courier", idempotency: "Transition id supplied", responses: "200, 409, 422" },
  ],
  events: [
    { name: "RestaurantAcceptedOrder", producer: "Order service", consumers: "Dispatch, notifications", delivery: "Outbox; duplicate-safe dispatch creation" },
    { name: "CourierAssigned", producer: "Dispatch", consumers: "Order projection, realtime gateway", delivery: "At-least-once with delivery version" },
    { name: "DeliveryCompleted", producer: "Delivery", consumers: "Settlement, receipts, analytics", delivery: "Settlement uses event-id inbox; dead-letter pages operations" },
  ],
  failures: [
    { name: "Menu changed", failure: "Item becomes unavailable after customer viewed it.", mitigation: "Quote and order validate menu version and availability; return a resolvable 409 diff." },
    { name: "Two couriers accept", failure: "Offers are accepted concurrently.", mitigation: "Single conditional delivery UPDATE or row lock elects exactly one winner; notify the loser." },
    { name: "Restaurant silent", failure: "Authorized order is not accepted before deadline.", mitigation: "Durable timer cancels order, voids authorization, and reports pending void state if provider is down." },
    { name: "Location stops", failure: "Courier app loses connectivity.", mitigation: "Show last-updated time and widen ETA; workflow status never depends on continuous GPS." },
    { name: "Duplicate completion", failure: "Courier retries completion after timeout.", mitigation: "Transition id and version make completion and settlement creation idempotent." },
    { name: "Settlement worker crash", failure: "Some participants appear unpaid.", mitigation: "Balanced entries commit atomically; provider payout is separately retried and reconciled." },
  ],
  consistency: { strong: ["Order price snapshot", "Restaurant acceptance transition", "Single courier assignment", "Balanced settlement entries"], eventual: ["Courier map position", "ETA", "Notifications", "Restaurant ranking"] },
  concurrency: ["Conditional UPDATE delivery SET courier_id = ? WHERE courier_id IS NULL elects the winner", "Versioned state transitions prevent pickup before assignment", "Unique settlement component keys prevent double credit", "No distributed lock is needed for a delivery owned by one PostgreSQL shard"],
  caching: { cache: ["Restaurant discovery results by coarse geocell", "Published versioned menus", "Static restaurant media"], never: ["Current courier assignment", "Whether restaurant can accept this order", "Settlement balance"], policy: "Short TTL discovery cache; menu keys include version. Invalidation accelerates closure changes, while order placement revalidates every assumption." },
  jobs: ["Restaurant acceptance deadline", "Offer expiry and redispatch", "Push notifications", "Payment void/capture reconciliation", "Settlement and payout", "Location retention cleanup"],
  security: ["Object-level authorization binds restaurant and courier resources to caller", "Courier sees customer address only for assigned active delivery", "Location access is short-lived, encrypted, and audited", "Signed, deduplicated provider webhooks", "Server recomputes all prices, fees, and payable amounts", "Rate-limit order creation, offers, and location ingestion independently", "Support overrides require reason and step-up authentication"],
  observability: baseObservability("assignment latency, unassigned delivery age, and late-delivery rate"),
  testing: [
    { layer: "Unit", coverage: "State machines, quote expiry, fee allocation, ETA fallback" },
    { layer: "Integration", coverage: "PostGIS service-area queries, assignment CAS, outbox, settlement constraints" },
    { layer: "Contract", coverage: "Restaurant adapter, payment webhooks, mobile realtime event versions" },
    { layer: "Concurrency", coverage: "Hundreds of couriers accept one offer; exactly one assignment" },
    { layer: "Failure", coverage: "Silent restaurant, offline courier, duplicate completion, provider timeout" },
    { layer: "End-to-end/load", coverage: "Order through settlement; burst tests aligned to meal-time geographic hotspots" },
  ],
  deployment: [
    { stage: "Stage 1", stack: "Modular API, PostgreSQL/PostGIS, Redis, managed queue, WebSocket gateway, workers" },
    { stage: "Stage 2", stack: "Replica APIs, separate dispatch workers, partitioned realtime channels, read replica for restaurant browsing" },
    { stage: "Stage 3", stack: "City-owned dispatch partitions and regional event streams; settlement remains separately controlled" },
  ],
  scale: scale("Scale reads, realtime gateways, and dispatch workers by city; isolate location writes from order PostgreSQL", "Assign city/region ownership for dispatch and location streams; keep order/settlement invariants within a single writer boundary"),
  diagrams: diagrams(
    "Customer --> Platform\nRestaurant --> Platform\nCourier --> Platform\nPlatform --> PaymentProvider\nPlatform --> MapsProvider",
    "Apps --> API\nAPI --> PostgreSQL\nAPI --> Redis\nAPI --> Queue\nCourierApp --> LocationIngest\nLocationIngest --> RealtimeGateway\nQueue --> DispatchWorker\nQueue --> SettlementWorker",
    "Customer->>API: POST /orders\nAPI->>PaymentProvider: authorize\nAPI->>PostgreSQL: create order + outbox\nAPI-->>Restaurant: new order\nRestaurant->>API: accept(prep time)\nAPI-->>Dispatch: RestaurantAcceptedOrder\nDispatch-->>Courier: expiring offer\nCourier->>API: accept offer\nAPI->>PostgreSQL: conditional assignment\nAPI-->>Courier: assigned"
  ),
};

export default project;

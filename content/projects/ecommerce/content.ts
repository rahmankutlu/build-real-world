import type { Project } from "@/lib/types";
import meta from "./metadata.json";
import { diagrams, scale } from "../helpers";

const project: Project = {
  ...meta,
  difficulty: "Advanced",
  purpose: "Sell physical goods from a searchable catalog while keeping prices, stock, money, fulfillment, and returns correct across retries and partial failures.",
  assumptions: ["One legal seller of record in v0.1", "Inventory is stocked at one or more fulfillment locations", "A PCI-compliant provider hosts card collection", "Example workload: 25 orders/second at peak, not a benchmark"],
  nonGoals: ["Marketplace seller onboarding", "Warehouse robotics", "Building a payment processor", "Globally active-active checkout"],
  journeys: [
    { name: "Checkout", steps: ["Load a server-priced cart", "Validate purchasability and shipping address", "Reserve stock in a transaction", "Create pending order", "Authorize provider payment", "Confirm order and publish through an outbox", "Release reservation on failure"] },
    { name: "Fulfillment", steps: ["Allocate order lines to a location", "Pick and pack", "Purchase carrier label", "Mark shipment dispatched", "Consume reservation", "Notify customer"] },
    { name: "Return", steps: ["Check return window and line eligibility", "Issue return authorization", "Receive and inspect item", "Restock or quarantine", "Request refund", "Close return after webhook confirmation"] },
  ],
  requirements: {
    must: ["Browse and search purchasable products", "Maintain server-authoritative carts", "Reserve inventory during checkout", "Authorize payment and create orders idempotently", "Track shipments and process refunds"],
    should: ["Guest checkout", "Promotion rules with an explainable price breakdown", "Split fulfillment by location", "Customer service order timeline"],
    future: ["Marketplace sellers", "Subscriptions", "Cross-border duties", "Personalized ranking"],
  },
  nfrs: [
    { concern: "Availability", decision: "Browsing may degrade to cached catalog data; checkout fails closed if price, inventory, or payment dependencies are uncertain." },
    { concern: "Consistency", decision: "Order totals and stock reservations are transactional. Search, recommendations, and shipment tracking may lag." },
    { concern: "Durability", decision: "Acknowledged orders and outbox records share one database commit; payment state is reconciled with the provider." },
    { concern: "Privacy", decision: "Minimize stored addresses, encrypt sensitive fields, and apply retention to guest data." },
    { concern: "Latency", decision: "Keep catalog reads cacheable; checkout is slower but bounded by provider timeouts and explicit pending states." },
  ],
  roles: [
    { role: "Customer", access: "Own carts, orders, addresses, and return requests" },
    { role: "Catalog manager", access: "Products and prices; no payment or support impersonation" },
    { role: "Warehouse operator", access: "Assigned fulfillment tasks and stock adjustments" },
    { role: "Support", access: "Scoped order view and audited refund request, never raw payment credentials" },
  ],
  entities: [
    { name: "Product → Variant", relationship: "A product presents one or more sellable SKUs" },
    { name: "Cart → CartLine", relationship: "A cart snapshots quantity, not authoritative price" },
    { name: "Order → OrderLine", relationship: "Immutable commercial snapshot of SKU, price, tax, and discount" },
    { name: "InventoryItem → Reservation", relationship: "On-hand stock is protected by expiring reservations" },
    { name: "Order → Shipment / Return", relationship: "An order can split into shipments and later line-level returns" },
  ],
  tables: [
    { name: "product_variants", purpose: "Sellable SKU and catalog state", columns: ["id UUID PK", "product_id UUID FK products", "sku TEXT", "status TEXT", "price_minor BIGINT", "currency CHAR(3)", "version INT"], constraints: ["UNIQUE(sku)", "price_minor >= 0"], indexes: ["(product_id)", "(status, updated_at) for indexing feed"] },
    { name: "inventory", purpose: "Stock by SKU and location", columns: ["variant_id UUID FK", "location_id UUID FK", "on_hand INT", "reserved INT", "version INT"], constraints: ["PK(variant_id, location_id)", "reserved BETWEEN 0 AND on_hand"], indexes: ["(location_id, variant_id) supports allocation"] },
    { name: "orders", purpose: "Checkout aggregate and payment state", columns: ["id UUID PK", "customer_id UUID FK NULL", "status TEXT", "currency CHAR(3)", "total_minor BIGINT", "payment_intent_ref TEXT", "created_at TIMESTAMPTZ"], constraints: ["UNIQUE(payment_intent_ref)", "total_minor >= 0"], indexes: ["(customer_id, created_at DESC)", "(status, created_at) for operations"] },
    { name: "order_lines", purpose: "Immutable purchase snapshot", columns: ["id UUID PK", "order_id UUID FK", "variant_id UUID FK", "sku TEXT", "quantity INT", "unit_price_minor BIGINT", "tax_minor BIGINT"], constraints: ["quantity > 0", "UNIQUE(order_id, id)"], indexes: ["(order_id)"] },
    { name: "inventory_reservations", purpose: "Expiring claim on stock", columns: ["id UUID PK", "order_id UUID FK", "variant_id UUID FK", "location_id UUID FK", "quantity INT", "expires_at TIMESTAMPTZ", "status TEXT"], constraints: ["UNIQUE(order_id, variant_id, location_id)"], indexes: ["(status, expires_at) for reaper"] },
  ],
  transactions: ["Lock relevant inventory rows in deterministic SKU order, verify available = on_hand - reserved, increment reserved, insert reservations, order, and outbox atomically", "Refund records and order refundable amount update share a transaction; provider calls happen outside it", "Hard-delete abandoned carts after retention; never soft-delete commercial order records—use explicit states"],
  endpoints: [
    { method: "GET", path: "/v1/products?cursor=…", purpose: "Browse catalog using opaque stable cursor", permission: "Public", responses: "200, 400" },
    { method: "POST", path: "/v1/carts/:id/lines", purpose: "Add or replace a cart line", permission: "Cart owner", responses: "200, 409" },
    { method: "POST", path: "/v1/orders", purpose: "Price cart, reserve inventory, and start checkout", permission: "Cart owner", idempotency: "Required; key scoped to account and payload hash", responses: "201, 402, 409, 422" },
    { method: "GET", path: "/v1/orders/:id", purpose: "Read order timeline", permission: "Order owner or scoped support role", responses: "200, 403, 404" },
    { method: "POST", path: "/v1/orders/:id/cancel", purpose: "Request state-aware cancellation", permission: "Owner or support", idempotency: "Required", responses: "202, 409" },
    { method: "POST", path: "/v1/returns", purpose: "Create return authorization for eligible lines", permission: "Order owner or support", idempotency: "Required", responses: "201, 409, 422" },
  ],
  events: [
    { name: "OrderConfirmed", producer: "Checkout", consumers: "Fulfillment, email, analytics", delivery: "Transactional outbox; at-least-once; consumers deduplicate by event id" },
    { name: "ReservationExpired", producer: "Inventory worker", consumers: "Order workflow", delivery: "Retry safely; conditional status transition prevents releasing twice" },
    { name: "ShipmentDispatched", producer: "Fulfillment", consumers: "Notifications, order projection", delivery: "Dead-letter after bounded retries; operations can replay" },
  ],
  failures: [
    { name: "Stock race", failure: "Two checkouts see the last item.", mitigation: "Row lock and invariant check inside one reservation transaction; loser receives 409." },
    { name: "Payment timeout", failure: "Provider authorizes but the API sees a timeout.", mitigation: "Keep order payment_pending; query by provider idempotency reference and reconcile before retrying." },
    { name: "Duplicate submit", failure: "Client retries POST /orders.", mitigation: "Persist idempotency key, payload hash, status, and prior response under the same account." },
    { name: "Event redelivery", failure: "Fulfillment receives OrderConfirmed twice.", mitigation: "Inbox/event receipt unique constraint and idempotent task creation." },
    { name: "Reservation leak", failure: "Worker crashes after payment failure.", mitigation: "Expiry-indexed reaper releases only active reservations with conditional updates." },
    { name: "Stale catalog", failure: "Cached page shows an old price.", mitigation: "Display indicative price; reprice server-side and require explicit confirmation when total changes." },
  ],
  consistency: { strong: ["Inventory reservation", "Order total snapshot", "Refundable balance", "State transition preconditions"], eventual: ["Search index", "Recommendations", "Email", "Carrier tracking projection"] },
  concurrency: ["Use SELECT … FOR UPDATE on inventory rows, not a distributed lock", "A unique idempotency record prevents duplicate orders", "Order version or conditional status UPDATE rejects cancellation after dispatch", "Refund sum is checked while locking the order payment row"],
  caching: { cache: ["Published catalog by locale", "Product media", "Facets and popular search results"], never: ["Available-to-promise during checkout", "Authoritative price at order creation", "Refundable amount"], policy: "Cache-aside with short TTL plus product-change invalidation; CDN assets use content hashes. Serve stale catalog on read failure but never bypass checkout validation." },
  jobs: ["Expire stock reservations", "Publish transactional outbox", "Index product changes", "Send receipts", "Poll carrier status", "Reconcile payment intents and refunds"],
  security: ["Object-level checks on every cart, order, address, and return", "Hosted payment fields keep card data outside the application boundary", "Signed provider webhooks with timestamp tolerance and replay deduplication", "Promotion and quantity inputs revalidated server-side", "Rate limits by account, IP, and checkout risk signals", "Audit privileged refunds and inventory adjustments with reason", "Prevent stored XSS in merchant-authored catalog content"],
  observability: { logs: ["Order, reservation, payment, and fulfillment transitions with request/order ids and reason—never addresses or payment tokens", "Checkout repricing differences and rejected stock invariants", "Outbox/worker attempt with event id and terminal outcome"], metrics: ["Checkout authorization failures and payment_pending age", "Inventory reservation conflict and expiry rate by SKU/location", "Order-to-allocation and allocation-to-dispatch latency", "Outbox age, fulfillment backlog, and refund reconciliation exceptions"], traces: ["Trace checkout across pricing, inventory transaction, provider authorization, outbox, and fulfillment", "Trace return receipt through refund initiation and provider convergence"], alerts: ["Confirmed orders without fulfillment work", "Payment-pending orders exceed reconciliation window", "Reserved exceeds on-hand invariant or reservation expiry worker stalls"] },
  testing: [
    { layer: "Unit", coverage: "Money arithmetic, promotion precedence, state machines, reservation expiry" },
    { layer: "Integration", coverage: "Real PostgreSQL constraints, row locking, outbox atomicity, provider adapter sandbox" },
    { layer: "Contract", coverage: "Payment and carrier webhook fixtures, consumer event schemas" },
    { layer: "Concurrency", coverage: "Many checkouts for one SKU; assert reserved never exceeds on_hand" },
    { layer: "Failure", coverage: "Timeout after authorization, duplicate events, worker death before acknowledgement" },
    { layer: "End-to-end/load", coverage: "Browse → checkout → cancel/ship/return; workload shaped by browse-to-buy ratio" },
  ],
  deployment: [
    { stage: "Stage 1", stack: "Next.js UI/API, PostgreSQL, one worker, provider-hosted checkout, object storage" },
    { stage: "Stage 2", stack: "Load balancer, API replicas, Redis catalog cache, managed queue, search engine, PostgreSQL primary/read replica" },
    { stage: "Stage 3", stack: "Separate catalog/search from transactional ordering; partition inventory by region only after measured contention" },
  ],
  scale: scale("API replicas; Redis for catalog; search service; worker pools; database read replicas while writes remain primary-owned", "Regional catalog edges and partitioned order/stock ownership; separate fulfillment and search workloads; never multi-writer inventory without an explicit conflict model"),
  diagrams: diagrams(
    "Customer --> Storefront\nStorefront --> CommerceAPI\nCommerceAPI --> PaymentProvider\nCommerceAPI --> Carrier",
    "Storefront --> API\nAPI --> PostgreSQL\nAPI --> Redis\nAPI --> Search\nAPI --> PaymentProvider\nPostgreSQL --> OutboxWorker\nOutboxWorker --> Queue\nQueue --> FulfillmentWorker",
    "Customer->>API: POST /orders + Idempotency-Key\nAPI->>PostgreSQL: lock stock, create reservation + pending order\nAPI->>PaymentProvider: authorize(reference)\nalt authorized\nPaymentProvider-->>API: authorized\nAPI->>PostgreSQL: confirm order + outbox\nAPI-->>Customer: 201 confirmed\nelse timeout\nAPI->>PostgreSQL: retain payment_pending\nAPI-->>Customer: 202 pending\nend"
  ),
};

export default project;

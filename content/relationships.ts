export type ProjectRelationship = {
  patterns: string[];
  edgeCases: string[];
  relatedProjects: string[];
};

export const projectRelationships: Record<string, ProjectRelationship> = {
  ecommerce: { patterns: ["idempotency-keys", "outbox-pattern", "pessimistic-locking", "cache-aside"], edgeCases: ["oversell-on-read", "success-after-timeout", "reservation-leak"], relatedProjects: ["payment-platform", "food-delivery"] },
  "food-delivery": { patterns: ["saga-pattern", "outbox-pattern", "retry-with-backoff", "webhooks"], edgeCases: ["menu-version-drift", "out-of-order-location", "clock-skew-expiry"], relatedProjects: ["ride-hailing", "ecommerce"] },
  "ride-hailing": { patterns: ["optimistic-locking", "retry-with-backoff", "rate-limiting", "background-jobs"], edgeCases: ["out-of-order-location", "presence-is-not-authority", "clock-skew-expiry"], relatedProjects: ["food-delivery", "social-network"] },
  "hotel-pms": { patterns: ["multi-tenancy", "pessimistic-locking", "audit-logs", "webhooks"], edgeCases: ["last-slot-race", "business-date-midnight", "dst-repeated-time"], relatedProjects: ["appointment-saas", "payment-platform"] },
  "appointment-saas": { patterns: ["optimistic-locking", "background-jobs", "webhooks", "multi-tenancy"], edgeCases: ["last-slot-race", "hold-expires-in-payment", "reminder-after-reschedule"], relatedProjects: ["hotel-pms", "project-management"] },
  "project-management": { patterns: ["optimistic-locking", "pagination", "multi-tenancy", "audit-logs"], edgeCases: ["revoked-socket", "revoked-session-cache", "cursor-after-deletion"], relatedProjects: ["appointment-saas", "cloud-file-storage"] },
  "video-streaming": { patterns: ["background-jobs", "retry-with-backoff", "circuit-breaker", "event-sourcing"], edgeCases: ["bytes-without-metadata", "poison-message", "lock-holder-resumes"], relatedProjects: ["cloud-file-storage", "social-network"] },
  "social-network": { patterns: ["cqrs", "pagination", "rate-limiting", "cache-aside"], edgeCases: ["notification-fanout-spike", "event-schema-drift", "cursor-after-deletion"], relatedProjects: ["project-management", "video-streaming"] },
  "cloud-file-storage": { patterns: ["multi-tenancy", "background-jobs", "audit-logs", "pagination"], edgeCases: ["bytes-without-metadata", "metadata-without-bytes", "archive-bomb"], relatedProjects: ["video-streaming", "project-management"] },
  "payment-platform": { patterns: ["idempotency-keys", "outbox-pattern", "webhooks", "retry-with-backoff"], edgeCases: ["webhook-before-response", "success-after-timeout", "partial-refund-race"], relatedProjects: ["ecommerce", "hotel-pms"] },
};

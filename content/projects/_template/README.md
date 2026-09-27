# Project contribution checklist

Copy this directory to `content/projects/<slug>/` and replace every example. A flagship project is accepted for domain-specific reasoning, not for filling every field.

Before opening a pull request, confirm that the project explains:

- the user, product boundary, assumptions, and non-goals;
- the invariant and source of truth;
- the schema, indexes, uniqueness rules, and transaction boundaries;
- API permissions, status semantics, pagination, and idempotency;
- relevant events, retries, deduplication, and dead-letter behavior;
- at least five concrete failure modes and mitigations;
- strong versus eventual consistency and one real concurrency race;
- cache authority, invalidation, and background work;
- at least five relevant security controls;
- domain-specific logs, metrics, traces, and alerts;
- unit, integration, contract, concurrency, failure, and end-to-end tests;
- deployment and workload-driven evolution at three stages;
- a context, application, and critical-sequence Mermaid diagram.

Then register the project in `content/projects/index.ts`, add curated references in `content/relationships.ts`, and run `npm run validate`.

# Contributing

Thanks for improving Build Real World. Contributions should make an engineering decision easier to understand or a failure harder to overlook.

## Useful contributions

- Correct a technical error with a source or reproducible explanation.
- Deepen a transaction, failure, security, testing, or operations section.
- Add an edge case or pattern with a concrete counterexample.
- Improve a Mermaid diagram while keeping it readable.
- Improve accessibility, search, validation, or performance.
- Translate content without changing its technical meaning.

New flagship projects need a proposal before implementation; depth matters more than count.

## Content standard

A project must define actors and non-goals, domain-specific workflows, focused relational schema, permissions and idempotency for APIs, transaction boundaries, realistic failures and mitigations, consistency choices, security boundaries, operational signals, tests, deployment evolution, and three diagrams. Do not rename an existing architecture or invent throughput claims.

Use `content/projects/_template/content.ts.example` as the review checklist. Metadata must pass the Zod schema in `lib/content-schema.ts`.

## Workflow

1. Fork and create a focused branch.
2. Install with `npm install`.
3. Make a small, reviewable change.
4. Run `npm run lint && npm run typecheck && npm test && npm run validate && npm run build`.
5. For UI changes, run `npm run test:e2e` and include before/after screenshots.
6. Open the pull request and explain the engineering reasoning, not only the edited files.

By contributing, you agree that code is provided under MIT and educational content under CC BY 4.0 as described in [LICENSE](LICENSE).

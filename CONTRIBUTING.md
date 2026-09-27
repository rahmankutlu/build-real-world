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
2. Install the locked dependency graph with `npm ci`.
3. Make a small, reviewable change.
4. Run `npm run check && npm run build`.
5. For UI changes, run `npm run test:e2e` and include before/after screenshots.
6. Open the pull request and explain the engineering reasoning, not only the edited files.

## Adding a project

Start from [`content/projects/_template`](content/projects/_template/). A proposal must identify the actors, core invariant, source of truth, transaction boundary, retry behavior, concurrency risk, cache boundary, asynchronous work, security boundary, operational signals, and the workload pressure that justifies each scale transition.

Register the finished project and its curated relationships, then run `npm run og` and `npm run validate`. The validators reject missing metadata, shallow failure/security coverage, broken references, duplicate slugs, generic observability, sentences copied across case studies, invalid Mermaid diagrams, and missing or stale social-preview images.

### Social-preview images

`public/social-preview.png`, `public/og/projects/*.png`, and the PNG icons are generated from content by `npm run og` and committed, so builds never need network access. Regenerate them whenever you change a project's title, summary, difficulty, topics, or system traits; `npm run validate` fails when an image is stale. The generator downloads the Inter font from Google Fonts on first use.

## Licensing contributions

By contributing, you agree that:

- source code, tests, scripts, configuration, and automation are provided under the [MIT License](LICENSE);
- educational prose, diagrams, structured case-study content, and documentation assets are provided under [CC BY 4.0](LICENSE-CONTENT).

You must have the right to submit the material. Do not include proprietary architecture, credentials, customer data, or text copied from restricted sources.

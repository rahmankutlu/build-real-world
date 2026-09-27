# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions. The project uses semantic versioning for the application and content schema.

## [Unreleased]

## [0.1.2] - 2026-09-27

### Fixed

- Ecommerce and Payment Platform workflow sequence diagrams failed to parse in production because a `;` inside a sequence message is a Mermaid statement separator; the messages now use commas, and the pages no longer show Mermaid's "Syntax error in text" graphic.
- Mermaid renders are serialized, cancelled on unmount or theme change, and measured in an off-screen host so diagrams keep correct geometry; leaked temporary and error nodes are removed from `document.body`.
- Failed diagrams show a neutral "Diagram unavailable." fallback with enlargement disabled, and a transient Mermaid chunk-load failure no longer breaks diagrams until reload.
- Diagrams scroll within their frame on narrow screens instead of shrinking to unreadable sizes.

### Added

- `validate-mermaid` parses all 30 project diagrams with the pinned Mermaid 11.17.2 as part of `npm run validate`.
- Unit regression tests for every project diagram and for the diagram lifecycle, plus Playwright coverage that renders all 30 diagrams across both themes, checks rendered geometry, enlargement, mobile layout, and the GitHub Pages base path.

## [0.1.1] - 2026-09-27

### Added

- Production GitHub Pages URL handling, complete social metadata, JSON-LD breadcrumbs, and a 1200×630 social preview.
- Curated project-to-pattern, edge-case, and related-system links.
- SEO and static-export validation for canonical URLs, social cards, base paths, and public artifacts.
- Mobile navigation, active project table of contents, diagram enlargement, and URL-persistent search.

### Changed

- Rebuilt the public README and clarified the MIT/CC BY 4.0 licensing split.
- Replaced shared observability boilerplate with domain-specific operational signals for all ten systems.
- Split CI quality, build, and browser jobs; constrained Dependabot grouping to minor and patch updates.

## [0.1.0] - 2026-09-27

### Added

- Static Next.js knowledge platform with dark and light themes.
- Ten production-oriented system-design case studies.
- Seventeen engineering patterns and thirty edge cases.
- Full-text search, project filters, architecture comparison, and learning paths.
- Zod content validation, internal-reference checks, unit tests, Playwright flows, CI, CodeQL, and static export.

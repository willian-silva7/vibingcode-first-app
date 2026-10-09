# Implementation Plan: Create Review Page

**Branch**: `001-create-review-page` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-create-review-page/spec.md`

## Summary

Add a Review page to the static fruit storefront for subscribing to RSS/Atom feeds, following
explicit product prices, reading articles newest-first, and tracking read/unread state. Keep
review data on the device in a SQLite database compiled to WebAssembly; store exported database
snapshots in IndexedDB. Fetch and parse feeds in the browser, and sanitize untrusted article HTML
with a self-hosted DOMPurify allow-list before rendering. Do not add a backend or feed proxy.

## Technical Context

**Language/Version**: Browser JavaScript, HTML, and CSS; retain the existing plain-script static
application.

**Primary Dependencies**: Existing Playwright and `http-server`; add pinned browser builds of
sql.js (and its matching WASM binary) for SQLite and DOMPurify for feed-content sanitization.
Commit their pinned browser distribution assets and upstream license notices under `ShoopingApp/`,
and serve them from the app origin, not a runtime CDN.

**Storage**: SQLite schema in sql.js memory, persisted as versioned database-byte snapshots in
IndexedDB. Serialize saves and use revision checks to prevent a stale tab from overwriting a
newer snapshot. This is local to the current browser origin/profile and can be removed by browser
storage clearing or eviction.

**Testing**: Existing Playwright suite (`npm test`), extended with deterministic feed fixtures
and focused Review Page integration/security/persistence tests.

**Target Platform**: Current desktop and mobile browsers served over localhost or HTTPS, with
WebAssembly and IndexedDB support. Direct feed refresh additionally requires source CORS access.

**Project Type**: Static, browser-only web application; no backend.

**Performance Goals**: A user can add a feed and one follow in under two minutes. Sorting and
evaluating a deterministic test set of at least 20 dated articles must complete as one responsive
page interaction.

**Constraints**: No server-side storage, accounts, proxy, payments, or background polling. Only
HTTP(S) feed/article URLs are accepted. Cross-origin feeds without permissive CORS cannot be
read by the browser and must fail visibly without discarding cached data. Untrusted markup must
never be inserted without sanitization; failure to sanitize falls back to text.

**Scale/Scope**: Existing 10-product storefront catalog, a modest personal collection of feeds
and locally cached articles, and one browser profile. Public feed availability and CORS are not
assumed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Prototype scope and honesty**: Pass. This feature adds a local review capability; order and
  payment flows remain simulated and unchanged.
- **Lightweight client-side architecture**: Pass with explicit, narrow approval. The user's
  instruction explicitly requires SQLite and HTML sanitization, allowing the necessary browser
  WASM and sanitizer dependencies under the constitution's exception. The app remains static,
  does not add a server or proxy, and keeps all review data on the device.
- **Reliable shopping journey**: Pass. The Review page is an additive navigation destination;
  the existing product, detail, cart, and checkout flows remain intact.
- **Responsive and accessible UX**: Pass when implemented with labeled, keyboard-operable feed,
  follow, filter, refresh, and read-state controls plus accessible status/error messaging.
- **Verified, minimal changes**: Pass. Add focused Playwright coverage for the new page and run
  `npm test`; test feed behavior with local fixtures rather than external services.

No constitution gate failures remain. Re-check after design: the additional libraries and
SQLite persistence are directly required by the approved feature constraints and must be
self-hosted without introducing application build infrastructure beyond what is necessary to
place their browser assets under the static app root.

**Post-design recheck**: Pass. The design remains browser-only, keeps review data on-device,
rejects stale persistence snapshots instead of losing cross-tab updates, and sanitizes all
untrusted article markup at the rendering boundary. The selected dependencies are limited to
the explicitly required SQLite runtime and a maintained HTML sanitizer.

## Project Structure

### Documentation (this feature)

```text
specs/001-create-review-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── feed-format.md
```

### Source Code (workspace)

```text
ShoopingApp/
├── index.html                 # Add Review navigation and load local browser dependencies
├── app.js                     # Add Review route without changing existing shopping behavior
├── review-page.js             # Review screen, controls, and accessible status rendering
├── review-feeds.js            # URL validation, RSS/Atom parsing, price evaluation, sanitization
├── review-store.js            # SQLite schema/queries and IndexedDB snapshot persistence
├── styles.css                 # Responsive Review page styles
└── vendor/
    ├── sql.js/                # Pinned sql.js browser runtime and matching WASM asset
    └── dompurify/             # Pinned DOMPurify browser build

tests/
├── app.spec.js                # Existing storefront regression tests
├── review.spec.js             # Review Page user-flow, persistence, and hostile-content tests
└── fixtures/feeds/            # Deterministic RSS/Atom fixtures, including invalid and hostile entries
```

**Structure Decision**: Keep the existing single static application in `ShoopingApp/` and the
Playwright suite in workspace-level `tests/`. Split the new feature into feed handling, local
storage, and page interaction files so database and untrusted-input behavior can be tested
without rewriting the established storefront. Load pinned browser assets locally because the
configured static server serves `ShoopingApp/`, not root `node_modules/`. Commit the pinned
distribution files and matching license/version notices so direct static hosting does not depend
on a package install or runtime CDN.

## Complexity Tracking

| Added complexity | Why needed | Simpler alternative rejected because |
|---|---|---|
| SQLite WASM plus IndexedDB snapshot persistence | User explicitly requires SQLite and device-local retention while the app remains browser-only | A server violates the static/local-only boundary; plain IndexedDB records are not SQLite |
| DOMPurify with a strict allow-list | Feed article markup is untrusted and some formatting should remain readable | Text-only rendering drops formatting; handwritten filtering is not a safe HTML sanitizer |
| Separate review feed/store/page files | Feed parsing, XSS boundaries, and persistence are distinct high-risk behaviors | Adding all of this to the existing storefront script would couple and obscure security/storage logic |

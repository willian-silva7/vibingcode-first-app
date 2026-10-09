# Research: Review Page

**Date**: 2026-10-09

## Decisions

### Browser-local SQLite persistence

- **Decision**: Run SQLite in the browser with `sql.js` (SQLite compiled to WebAssembly).
  Persist the exported SQLite database bytes as a blob in IndexedDB, loading them before
  opening the database and saving a new snapshot after each successful write transaction.
- **Rationale**: This keeps the app static and browser-only as requested, uses SQLite for the
  relational review data, avoids server-side persistence, and uses IndexedDB for larger local
  data rather than Web Storage. Feed refresh and article status writes are low-volume enough for
  snapshot persistence.
- **Operational rules**: Serialize database writes and snapshot saves; await the IndexedDB
  transaction before reporting a write as saved; surface quota, unavailable-storage, and
  initialization failures. Store a monotonically increasing snapshot revision with the exported
  bytes. A save must compare the revision it loaded with the current revision within one
  IndexedDB read-write transaction; reject a stale save and prompt the user to reload rather than
  silently overwrite another tab. Treat persistence as origin-scoped and subject to browser
  clearing, eviction, private-mode restrictions, and quota limits.
- **Alternatives considered**:
  - SQLite WASM with OPFS provides file-backed persistence, but needs a worker-based VFS and
    introduces deployment and browser-compatibility constraints (including cross-origin
    isolation for the standard VFS); this is unnecessary for the prototype's modest write load.
  - IndexedDB records without SQLite are simpler but do not meet the explicit SQLite requirement.
- **Sources**: [sql.js project documentation](https://github.com/sql-js/sql.js),
  [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API),
  [SQLite WASM persistence](https://sqlite.org/wasm/doc/trunk/persistence.md),
  [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

### Sanitizing feed article HTML

- **Decision**: Use a pinned, locally hosted DOMPurify build, configured with a narrow HTML
  allow-list for basic article formatting. Exclude SVG, MathML, scripts, embedded content,
  style attributes, event handlers, and unsafe URL protocols. Sanitize immediately before
  insertion into the DOM; keep titles, URLs, and plain-text summaries in text-only sinks.
- **Rationale**: Feed content is untrusted HTML. Sanitization preserves selected formatting
  while removing active content; text-only data should be encoded as text instead. Sanitizing
  at the output boundary also prevents cached feed markup from being treated as trusted.
- **Failure behavior**: If DOMPurify is not available or fails, render the article body as plain
  text and report the dependency failure; never inject the original markup.
- **Alternatives considered**:
  - Escaping all content is safe for plain text but discards expected article formatting.
  - Hand-written tag/attribute filtering is error-prone and is not an acceptable sanitizer.
- **Sources**: [DOMPurify documentation](https://github.com/cure53/DOMPurify),
  [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### Browser feed access

- **Decision**: Fetch user-provided HTTP(S) RSS/Atom URLs directly from the browser. Parse XML
  as XML, validate the document/root and entry structure, and report network, CORS, and
  malformed-feed errors while retaining the last successful local copy.
- **Rationale**: The project must remain static and browser-only; introducing a proxy or backend
  would violate its product boundary. Browser cross-origin policy means a syntactically valid
  public feed is not necessarily readable by this page.
- **Constraint**: Only feeds whose servers permit browser cross-origin access can be refreshed.
  Do not use a third-party proxy or silently convert failures into empty feeds.

### Explicit product-price fields in feed entries

- **Decision**: Define and document a small namespaced feed extension in the feature contract.
  RSS `<item>` and Atom `<entry>` entries use a `product-id` element and a `price` element with
  `currency="USD"`. Match `product-id` to the stable product IDs in the storefront catalog. The
  user selected the documented `vcp` namespace contract rather than accepting similarly named
  fields from arbitrary namespaces.
- **Rationale**: RSS and Atom do not define a universal product identity/price vocabulary.
  Explicit fields are required by the feature; a documented extension avoids unreliable
  extraction from prose and makes fixtures and publisher behavior testable.
- **Constraint**: Articles without matching explicit values remain readable but do not generate
  price observations or follow matches.

## Implementation Constraints

- Serve pinned browser builds of sql.js, its matching WebAssembly file, and DOMPurify from the
  app's own static origin; do not depend on a CDN at runtime.
- Use SQL parameters for all values originating from feeds or user input.
- Allow only HTTP(S) feed and article URLs; reject embedded URL credentials and unsafe schemes.
- RSS/Atom fields are untrusted. Do not insert a parsed XML node or raw feed string into HTML.
- Preserve existing store pages and use deterministic local feed fixtures for automated tests;
  public feeds and their CORS policies must not be test dependencies.

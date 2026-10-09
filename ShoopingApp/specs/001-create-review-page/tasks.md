# Tasks: Create Review Page

**Input**: Design documents in `specs/001-create-review-page/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/feed-format.md`, `quickstart.md`

**Testing**: Add focused Playwright tests for each user story; the constitution requires
automated coverage for visible behavior changes.

## Phase 1: Setup

**Purpose**: Make the explicitly required browser dependencies available to the static app.

- [X] T001 [P] Pin sql.js and DOMPurify versions in `package.json` and the npm lockfile, copy their browser runtime assets and matching WebAssembly file into `ShoopingApp/vendor/`, and include each upstream license and version notice

## Phase 2: Foundational

**Purpose**: Build the shared Review route, persistence boundary, and safe rendering foundation
required by every user story.

- [X] T002 [P] Add the Review navigation button and route dispatch in `ShoopingApp/index.html` and `ShoopingApp/app.js` while preserving the existing Products, Product Details, Shopping Cart, and Checkout routes
- [X] T003 [P] Create the versioned SQLite schema and initialization/migration entry point in `ShoopingApp/review-store.js`; enforce HTTP(S)-only canonical unique feed URLs, article `entry_key` uniqueness per feed, nullable publication/content fields, stable first-seen order and boolean `is_read` default false, PriceFollow's existing-catalog product ID plus `absolute_max`/`percent_increase`/`percent_decrease` type and finite non-negative threshold, and one positive integer USD-cent observation per article/product
- [X] T004 Implement IndexedDB database-byte snapshot load/save in `ShoopingApp/review-store.js`; save schema version and monotonically increasing revision, serialize writes, compare the stored revision and write the snapshot atomically in one IndexedDB read-write transaction, and reject stale revisions
- [X] T005 Implement Review page initialization, empty state, accessible status region, and error presentation in `ShoopingApp/review-page.js`, loading state from `ShoopingApp/review-store.js` without changing existing storefront behavior
- [X] T006 Implement strict DOMPurify configuration and the article-rendering sanitization boundary in `ShoopingApp/review-feeds.js`; allow only the tags and safe HTTP(S) links listed in `specs/001-create-review-page/contracts/feed-format.md`, and return plain text rather than raw markup if sanitization is unavailable

## Phase 3: User Story 1 - Follow product prices in feeds (Priority: P1)

**Goal**: Subscribe to RSS/Atom feeds and configure absolute or percentage price conditions.

**Independent Test**: Add a valid fixture feed, add a product follow, and verify valid qualifying
observations are identified while invalid, unmatched, or insufficient observations do not create
false matches.

- [X] T007 [P] [US1] Add Playwright RSS/Atom fixtures and tests for feed add/remove, duplicate and invalid URLs, exact `vcp` namespace parsing, product matching, and absolute/increase/decrease thresholds in `tests/review.spec.js` and `tests/fixtures/feeds/`
- [X] T008 [US1] Implement HTTP(S)-only feed URL validation, browser fetch error reporting, RSS 2.0/Atom 1.0 parsing, stable entry identity, and exact `urn:fruit-storefront:product-price:v1` field validation in `ShoopingApp/review-feeds.js` according to `specs/001-create-review-page/contracts/feed-format.md`
- [X] T009 [US1] Implement feed subscription, removal, price-follow CRUD, and valid price-observation persistence in `ShoopingApp/review-store.js`; enforce unique canonical feed URLs, catalog product IDs, positive USD cents, and condition types `absolute_max`, `percent_increase`, and `percent_decrease`
- [X] T010 [US1] Implement consecutive same-product/same-feed price evaluation and absolute ceiling matching in `ShoopingApp/review-feeds.js`; percentage thresholds must use positive magnitudes and require a preceding valid observation
- [X] T011 [US1] Add the Review page feed URL form, subscription list, price-follow controls, match indicators, and accessible validation/fetch feedback in `ShoopingApp/review-page.js`
- [X] T012 [US1] Connect Review page actions to feed parsing and SQLite persistence in `ShoopingApp/app.js`, retaining cached data and reporting failure when a feed cannot be fetched

## Phase 4: User Story 2 - Review articles and reading status (Priority: P2)

**Goal**: Read cached feed articles newest-first and track read/unread state.

**Independent Test**: With dated and undated entries in deterministic feed fixtures, verify sorting,
read/unread toggles, unread filtering, stable ties, and hostile-content sanitization.

- [X] T013 [P] [US2] Add Playwright tests for newest-first sorting, stable equal/missing-date order, read/unread toggling, unread filtering, permitted article formatting, and malicious HTML in `tests/review.spec.js` and `tests/fixtures/feeds/`
- [X] T014 [US2] Implement article upsert by stable `entry_key` in `ShoopingApp/review-store.js`, preserving existing `is_read` and `first_seen_order` across refreshes and cascading feed removal to articles and observations
- [X] T015 [US2] Implement article read/unread updates and unread-filter queries in `ShoopingApp/review-store.js`
- [X] T016 [US2] Render article cards newest-first, placing undated entries after dated entries and using stable first-seen order for ties, in `ShoopingApp/review-page.js`
- [X] T017 [US2] Add accessible read/unread controls and unread-only filtering in `ShoopingApp/review-page.js`; render titles and summaries as text and sanitize cached article HTML immediately before DOM insertion
- [X] T018 [US2] Wire refresh, article upsert, read-state changes, and filter state to the feed and store modules in `ShoopingApp/app.js`; a failed refresh must retain cached articles and status

## Phase 5: User Story 3 - Keep review data on this device (Priority: P3)

**Goal**: Restore feeds, follows, cached articles, and reading state after reload, and accurately
report persistence failures.

**Independent Test**: Save a feed, follow, article, and read state; reload the same browser
profile; verify all values return. Simulate quota/write and stale-revision failures and confirm
the UI does not claim unsaved changes were saved.

- [X] T019 [P] [US3] Add Playwright persistence tests for reload restoration, IndexedDB write failure, unavailable storage, stale snapshot conflicts, schema migration, and preservation of the previous snapshot in `tests/review.spec.js`
- [X] T020 [US3] Implement restore-before-render and persist-after-mutation flow in `ShoopingApp/review-page.js` and `ShoopingApp/review-store.js`, restoring subscriptions, follows, articles, observations, and read state
- [X] T021 [US3] Implement schema-version migration and recoverable initialization errors in `ShoopingApp/review-store.js`; on open or migration failure preserve the stored database bytes and never initialize over them with an empty database
- [X] T022 [US3] Surface IndexedDB quota/unavailable errors and stale-revision conflicts accessibly in `ShoopingApp/review-page.js`; do not report a mutation as saved until the snapshot transaction succeeds
- [X] T023 [US3] Add deterministic reload and two-page stale-write scenarios to `tests/review.spec.js`, verifying that a stale tab is prompted to reload rather than overwriting the newer snapshot

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Verify the entire feature and preserve existing storefront behavior.

- [X] T024 [P] Add responsive Review page styles and visible keyboard focus states in `ShoopingApp/styles.css`
- [X] T025 [P] Update Review Page feature behavior, feed format, local persistence limits, and CORS requirements in `ShoopingApp/README.md`
- [X] T026 Run `npm test` from the workspace root and resolve Review Page regressions in `ShoopingApp/` and `tests/review.spec.js` or storefront regressions in `ShoopingApp/app.js` and `tests/app.spec.js`
- [X] T027 Validate every quickstart scenario in `specs/001-create-review-page/quickstart.md` and record any environment-specific browser, CORS, or storage limitations there

## Dependencies

```text
T001 -> T003, T004, T006
T002, T003, T004, T005, T006 -> User Story 1
User Story 1 -> User Story 2
User Story 2 -> User Story 3
User Story 3 -> T024, T025, T026, T027
```

- T001, T002, T003, and T006 are prerequisites for Review feature implementation.
- T004 depends on the database initialization/schema from T003.
- T005 depends on route setup (T002) and persistence initialization (T003-T004).
- User Story 2 builds on article ingestion from User Story 1; User Story 3 validates restoration
  and failure behavior for the data created by the first two stories.
- Tasks marked `[P]` can be worked on concurrently once their phase prerequisites are complete;
  tasks editing the same file should be coordinated and applied in separate ordered edits.

## Parallel Execution Examples

### Setup and shared foundation

```text
T001 (vendor/runtime pinning) can proceed alongside T002 (navigation/route)
After T001: T003 (schema) and T006 (sanitizer) can proceed in parallel
After T003: T004 (snapshot persistence)
```

### User Story 1

```text
T007 (US1 tests/fixtures) can proceed alongside T008 (feed parsing)
T009 (store operations) can proceed after T003 and independently of T008
T010 follows T008; T011 follows T005; T012 integrates T008-T011
```

### User Story 2

```text
T013 (US2 tests) can proceed alongside T014 (article upsert)
After T014: T015 (read state) and T016 (article list) can proceed in parallel
T017 follows T006 and T016; T018 integrates story behavior
```

### User Story 3 and polish

```text
T019 (US3 tests) can proceed alongside T021 (migration handling)
T020 follows story data operations; T022 follows T004 and T020
After story completion: T024 (styles) and T025 (README) can proceed in parallel
```

## Implementation Strategy

1. Complete Setup and Foundational work first: local dependency assets, route, versioned schema,
   snapshot persistence, Review shell, and sanitizer boundary.
2. Deliver User Story 1 as the MVP: allow feed subscriptions and price follows with reliable,
   explicit matching and useful errors.
3. Add User Story 2 for article browsing and read/unread workflow, preserving state during feed
   upserts.
4. Complete User Story 3 resilience with reload, schema migration, storage failure, and
   cross-tab conflict handling.
5. Finish responsive/accessibility polish, documentation, and the complete Playwright suite.

Each story must pass its independent scenarios before beginning the next story's integration.

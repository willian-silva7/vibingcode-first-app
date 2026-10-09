# Review Page Validation Quickstart

## Prerequisites

- A current Node.js/npm installation with the project dependencies installed.
- A current browser supported by Playwright.
- The Review Page implementation and its self-hosted browser dependencies present.

## Run the Existing Storefront and Tests

From the workspace root:

```bash
npm test
```

Expected result: all existing storefront smoke tests pass, including catalog display and the
add-to-cart flow.

## Validate the Review Page

Run the focused Playwright suite after implementation:

```bash
npx playwright test tests/review.spec.js
```

Expected coverage includes:

1. The Review Page opens with a useful empty state and remains usable on a narrow viewport.
2. A valid same-origin RSS/Atom fixture can be added, parsed, shown newest first, refreshed,
   and associated with product price observations.
3. Absolute-price and percentage increase/decrease follows match qualifying entries; the first
   observation and invalid/unmatched price values do not produce false percentage alerts.
4. Read/unread changes and cached articles survive a reload in the same browser profile, and a
   failed subsequent refresh retains the last successful state.
5. Invalid URLs, unsupported content, malformed feeds, and denied cross-origin requests produce
   accessible errors rather than a success-shaped empty feed.
6. Article markup containing script elements, event-handler attributes, dangerous URLs, and
   unsafe embedded content cannot execute or render as active content; allowed formatting remains
   readable.
7. Persistence transaction failures and stale multi-tab snapshot revisions are surfaced and
   never reported as successfully saved.
8. A database schema upgrade preserves existing feed, article, follow, and read-state data; a
   failed or unsupported migration does not replace the saved database with an empty one.

Use RSS/Atom fixtures fulfilled by Playwright routing so the tests are deterministic and do not
depend on public feed availability or third-party CORS configuration.

## Manual Browser Check

Start the configured local static server and open `http://127.0.0.1:4173`. Use a
CORS-enabled RSS/Atom feed containing the documented price extension, create an absolute and
percentage follow, exercise article reading state, reload, and confirm cached state is restored.
Inspect malformed and hostile article content and confirm it is shown only as sanitized
formatting or plain text.

## Related Design

- [Feature specification](./spec.md)
- [Data model](./data-model.md)
- [RSS/Atom feed contract](./contracts/feed-format.md)

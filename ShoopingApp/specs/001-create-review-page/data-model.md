# Review Page Data Model

## Storage Boundary

The application stores review data in SQLite (sql.js) local to the current browser profile. The
SQLite database is serialized to bytes and saved in IndexedDB; it is not synchronized or sent to
a server. Persist a schema version and snapshot revision. On a write, compare the loaded revision
with the current IndexedDB revision inside the persistence transaction; reject a stale write and
ask the user to reload rather than overwriting another tab's newer snapshot.

Feed contents are untrusted input; rendered article HTML is sanitized at display time and is
never treated as trusted database content.

## Entities

### FeedSubscription

Represents one RSS or Atom source supplied by the user.

| Field | Meaning | Rules |
|---|---|---|
| `id` | Stable local feed identifier | Primary key |
| `url` | Canonical feed URL | Required; HTTP(S) only; unique after canonicalization |
| `title` | Feed title from its metadata, or URL-derived label | Plain text |
| `last_fetched_at` | Time of last successful refresh | Nullable until first success |
| `last_fetch_status` | Latest refresh outcome | Success or failure; failure does not delete cached articles |
| `last_fetch_error` | User-displayable refresh explanation | Nullable; plain text |

### Article

Represents a feed entry and its locally cached presentation data.

| Field | Meaning | Rules |
|---|---|---|
| `id` | Stable local article identifier | Primary key |
| `feed_id` | Owning subscription | Foreign key to `FeedSubscription` |
| `entry_key` | Stable feed-entry identity | Required; unique within a feed |
| `title` | Entry title | Plain text |
| `url` | Entry link | Nullable; HTTP(S) only |
| `published_at` | Parsed publication timestamp | Nullable; missing/invalid dates sort after dated articles |
| `content_html` | Cached untrusted feed markup | Nullable; sanitize with a strict allow-list before rendering |
| `content_text` | Plain-text summary fallback | Nullable; insert as text, never interpreted as markup |
| `first_seen_order` | Stable tie-breaker for equal/missing dates | Required; fixed on first insertion |
| `is_read` | User's reading state | Boolean; defaults to false |

Article identity uses the feed's stable entry ID where available, then its canonical link.
Entries without either need a deterministic fallback derived from stable entry fields so refreshes
update rather than duplicate the same article. The fallback must be scoped to the feed.

### PriceFollow

Represents one threshold that the user wants to track for a storefront product.

| Field | Meaning | Rules |
|---|---|---|
| `id` | Stable local follow identifier | Primary key |
| `product_id` | Product catalog key | Required; must match an existing storefront product |
| `condition_type` | Price condition | `absolute_max`, `percent_increase`, or `percent_decrease` |
| `threshold` | Price ceiling or percentage magnitude | Required; finite and non-negative; percentage decrease/increase is a positive magnitude |
| `currency` | Price currency | USD only for this storefront prototype |

Multiple feeds may contribute observations for a follow; percentage comparison remains scoped to
the same feed.

### PriceObservation

Represents a valid price explicitly supplied by an article.

| Field | Meaning | Rules |
|---|---|---|
| `article_id` | Source article | Foreign key to `Article`; at most one observation per product/article |
| `product_id` | Matched storefront product | Required; unmatched products do not create observations |
| `price_minor_units` | Price in cents | Required; positive integer |
| `currency` | Currency of the price | Must be unambiguous USD |

An observation is eligible for percentage comparison only when the same feed has a preceding valid
observation for the same product. Order observations by publication timestamp, then stable
first-seen order. Missing/invalid dates remain visible and use stable first-seen order for
comparison; this ordering is an approximation when the publisher omits dates.

## Relationships

- One `FeedSubscription` has many `Article` records.
- An `Article` has zero or one explicit `PriceObservation`.
- One `PriceFollow` targets one storefront product and evaluates matching observations across
  subscribed feeds.
- Read/unread state belongs to an article and survives feed refreshes that update the same
  `entry_key`.

## State and Failure Behavior

- Adding a feed creates a subscription before loading entries; a failed first fetch remains
  visible with a recoverable error.
- A successful refresh upserts entries by `entry_key`; it does not reset existing read state.
- A failed refresh leaves cached articles, observations, and read state unchanged.
- Removing a feed removes its articles and observations; removing a follow does not delete
  articles or observations.
- Local database errors are reported to the user. The UI must not claim a change was saved if
  the persistence transaction fails.
- Feed-provided markup remains untrusted across storage and is sanitized again immediately before
  rendering; if sanitization is unavailable, show a plain-text representation.
- Database writes and IndexedDB snapshot saves are serialized. A stale snapshot revision is
  rejected, not written over a newer one.
- Schema changes use a versioned migration path. If the local database cannot be opened or
  migrated, preserve the stored snapshot and report recovery options rather than silently
  replacing it with an empty database.

# Feature Specification: Create Review Page

**Feature Branch**: `001-create-review-page`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Create an Review Page that allows users to follow changes by price (product prize, %up> or %down<) to feeds by URL, view articles sorted newest-first, and track read/unread status. Data should persist locally on the device."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Follow product prices in feeds (Priority: P1)

As a shopper, I want to add an RSS or Atom feed and follow a fruit product using a price
condition so that I can spot relevant price changes in the feed.

**Why this priority**: Feed subscriptions and price-follow conditions are the core purpose of
the page.

**Independent Test**: Add a valid feed containing entries with explicit product and price
values, create a price follow, and confirm that entries satisfying the condition are identified.

**Acceptance Scenarios**:

1. **Given** a valid RSS or Atom URL, **When** the user adds it, **Then** the Review Page lists
   the feed and its available articles.
2. **Given** a feed containing explicit price entries for a product in the storefront catalog,
   **When** the user creates an absolute-price, percentage-increase, or percentage-decrease
   follow for that product, **Then** qualifying entries are identified according to the
   configured condition.
3. **Given** a percentage-change follow and fewer than two price observations for that product
   in that feed, **When** an entry is evaluated, **Then** it is not reported as a percentage
   change until a prior observation exists.
4. **Given** a valid feed URL already subscribed to, **When** the user attempts to add that URL
   again, **Then** the page avoids creating a duplicate subscription and explains why.

### User Story 2 - Review articles and reading status (Priority: P2)

As a shopper, I want to review articles from my subscribed feeds in newest-first order and keep
track of which ones I have read.

**Why this priority**: Reviewing source articles lets users understand the context for a
reported price change.

**Independent Test**: Load multiple dated articles from subscribed feeds, verify their order,
mark an article read and unread, and verify the selected status and unread view.

**Acceptance Scenarios**:

1. **Given** articles with different publication dates, **When** the user views the Review Page,
   **Then** all available articles are ordered newest first.
2. **Given** an unread article, **When** the user marks it read, **Then** its displayed status
   changes to read.
3. **Given** a read article, **When** the user marks it unread or filters to unread articles,
   **Then** the article's status changes or the unread view includes it, respectively.
4. **Given** two articles with the same publication date, **When** the user views the list,
   **Then** their relative order remains consistent between views.

### User Story 3 - Keep review data on this device (Priority: P3)

As a shopper, I want my feeds, price follows, and reading progress to remain available when I
return to the page on this device.

**Why this priority**: Locally retained subscriptions and status make the review workflow useful
across visits without requiring an account.

**Independent Test**: Add a feed and follow, change an article's read status, reload the page,
and confirm these choices remain.

**Acceptance Scenarios**:

1. **Given** saved feeds, price follows, and read/unread choices, **When** the user reloads the
   page in the same browser on the same device, **Then** those choices are restored.
2. **Given** no previously saved review data, **When** the user opens the Review Page,
   **Then** an empty state explains how to add a feed.
3. **Given** a feed cannot be loaded or contains no usable price data, **When** it is refreshed,
   **Then** the page preserves the subscription and existing article/read data and explains the
   issue without reporting a false price change.

### Edge Cases

- A feed URL is malformed, duplicated, unreachable, or does not contain valid RSS/Atom content.
- An entry lacks a publication date, product identity, price value, or stable article identity.
- An entry reports a zero, negative, non-numeric, or currency-ambiguous price.
- A percentage follow has no prior price observation, or the previous price is zero.
- Multiple entries for a product arrive out of chronological order or have identical dates.
- A feed changes its article data on refresh, or an article appears in more than one feed.
- Local device storage is unavailable, full, or cleared by the user.
- A feed is temporarily inaccessible; existing local articles and read states remain available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Review Page MUST allow the user to add and remove RSS or Atom subscriptions
  using a feed URL.
- **FR-002**: The system MUST validate a feed URL and report invalid, unsupported, duplicate,
  or unavailable feeds without silently treating them as loaded.
- **FR-003**: The user MUST be able to create and remove price follows for products in the
  storefront catalog.
- **FR-004**: A price follow MUST support an absolute price ceiling, a percentage increase
  threshold, or a percentage decrease threshold.
- **FR-005**: The system MUST identify a price observation only when an entry explicitly
  contains a product identity and a valid price value that can be matched to a followed
  storefront product.
- **FR-006**: The system MUST calculate percentage movement against the preceding valid price
  observation for the same product in the same feed. An increase qualifies when its positive
  percentage meets or exceeds the configured increase threshold; a decrease qualifies when
  its decrease magnitude meets or exceeds the configured decrease threshold.
- **FR-007**: The system MUST identify an absolute-price follow when an observed price is at
  or below the configured price ceiling.
- **FR-008**: The Review Page MUST display available articles from subscribed feeds newest first
  and identify articles that satisfy a configured price follow.
- **FR-009**: Articles without a usable publication date MUST remain viewable after dated
  articles, with their relative order stable between views.
- **FR-010**: The user MUST be able to mark an article read or unread and view unread articles
  separately.
- **FR-011**: The system MUST preserve feed subscriptions, price follows, locally available
  articles, and each article's read/unread status on the user's device across page reloads.
- **FR-012**: When a feed refresh fails, the system MUST retain the last successfully loaded
  articles and reading statuses and clearly report that the feed could not be refreshed.
- **FR-013**: When local persistence is unavailable or fails, the system MUST tell the user
  that changes may not be retained.
- **FR-014**: The Review Page MUST provide meaningful accessible names and keyboard-operable
  controls, and expose refresh, validation, and persistence feedback accessibly.

### Key Entities *(include if feature involves data)*

- **Feed Subscription**: A user-added RSS or Atom source, identified by its URL and display
  title, with its last successful refresh result.
- **Price Follow**: A user's selected storefront product and one configured absolute-price,
  percentage-increase, or percentage-decrease condition.
- **Article**: A feed entry with its source, stable identity, title, link, publication date,
  available content, optional product/price observation, and read/unread status.
- **Price Observation**: A valid product price explicitly supplied by an article, associated
  with its product, feed, and article so it can be compared with the preceding observation in
  that feed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a valid feed URL and create one product price follow in under
  2 minutes when the feed is accessible.
- **SC-002**: In a test set of at least 20 valid dated articles from multiple feeds, every
  displayed article is in newest-first order.
- **SC-003**: For every test price sequence with valid explicit product/price values, the page
  identifies all and only entries that meet the configured absolute or percentage condition.
- **SC-004**: After reload on the same device and browser, 100% of saved feeds, follows, locally
  available articles, and read/unread choices are restored when local persistence is available.
- **SC-005**: Users can identify an invalid or inaccessible feed and whether their latest
  changes were saved from an accessible message without mistaking failure for success.

## Assumptions

- A feed URL points to an RSS or Atom article feed. The user confirmed this interpretation.
- Price observations must be explicit in the feed entry data; arbitrary prose extraction is
  outside this feature. The user confirmed this interpretation.
- Product identities in feed entries can be matched to products in the existing storefront
  catalog; unmatched entries remain available as articles but do not trigger a product follow.
- Percentage changes compare consecutive valid observations for the same product within the
  same feed. The configured decrease threshold is a positive percentage magnitude.
- An absolute-price condition means the observed price is at or below the user's price ceiling.
- Feeds are refreshed when the user requests a refresh and when initially added; background
  polling and notifications are not part of this feature.
- Saved information is available only on the same device and browser profile. It is not
  synchronized, and clearing browser data may remove it.
- A feed may be unavailable to the page due to network or source restrictions. In that case,
  the page reports the error and retains previously saved data.

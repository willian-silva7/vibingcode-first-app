# RSS/Atom Feed Contract

## Supported Documents

- RSS 2.0 documents with `<rss><channel><item>…</item></channel></rss>`.
- Atom 1.0 documents with `<feed xmlns="http://www.w3.org/2005/Atom"><entry>…</entry></feed>`.
- Feed and article URLs use HTTP or HTTPS. Embedded URL credentials and non-HTTP(S) schemes are
  rejected.
- Browser refresh succeeds only when the feed host permits cross-origin access from the
  storefront's origin. No server proxy is used.

## Entry Fields

RSS `<item>` and Atom `<entry>` support their standard title, link, stable identifier, publication
date, and content/summary fields. Product-price matching uses this explicit XML extension
namespace:

```xml
xmlns:vcp="urn:fruit-storefront:product-price:v1"
```

Each price-bearing item or entry may include:

```xml
<vcp:product-id>apple</vcp:product-id>
<vcp:price currency="USD">1.25</vcp:price>
```

- `product-id` MUST exactly match a stable product ID in the storefront catalog (for example,
  `apple` or `banana`). Matching is case-sensitive; no fuzzy name matching is performed.
- Both extension elements MUST use the `urn:fruit-storefront:product-price:v1` namespace.
- `price` MUST be a positive decimal amount in USD with at most two fractional digits. Commas,
  currency symbols in the value, non-finite values, zero, negative amounts, and missing or
  ambiguous currencies are invalid.
- The extension fields are optional. Entries without both valid fields remain ordinary
  readable articles and do not create price observations.
- At most one product-price observation per entry is supported in this feature.

## Identity and Ordering

- Prefer RSS `guid` or Atom `id` as the stable entry identity.
- If absent, use the canonical HTTP(S) entry link. If both are absent, derive a deterministic
  identity from the feed URL and stable title/date/content fields; keep this fallback scoped to
  that feed. Fully identical entries without an ID or link are indistinguishable and may be
  treated as one entry.
- Prefer RSS `pubDate` and Atom `published`, falling back to Atom `updated` where needed.
- Entries with valid dates are displayed newest first. Missing or invalid dates follow dated
  entries and retain stable first-seen ordering.

## Content and Security

- Titles and plain-text summaries are always rendered as text, not HTML.
- Feed markup is untrusted. Article HTML may retain only `p`, `br`, `strong`, `em`, `b`, `i`,
  `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, and `a` with a safe HTTP(S) `href` after
  DOMPurify sanitization.
- Scripts, event-handler attributes, SVG, MathML, embedded objects, styles, images, and unsafe
  URL protocols are not rendered.
- Sanitization is repeated immediately before HTML insertion. If the sanitizer is unavailable,
  show a text-only version; never fall back to inserting raw markup.
- Malformed XML, non-RSS/Atom documents, unsupported content, and fetch/CORS failures produce
  clear user-facing errors and do not clear the last successfully cached articles.

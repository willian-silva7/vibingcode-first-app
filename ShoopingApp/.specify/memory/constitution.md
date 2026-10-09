<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles: template placeholders -> five project-specific core principles
Added sections: Product and Technical Boundaries; Development and Quality Gates
Removed sections: none
Follow-up TODOs: none
-->

# Fruit Storefront Prototype Constitution

## Core Principles

### I. Prototype Scope and Honesty
The storefront is a client-side prototype for demonstrating fruit shopping interactions.
Checkout and order confirmation MUST remain simulated. The application MUST NOT imply that a
real payment was processed or an order was submitted, persisted, or fulfilled.

### II. Lightweight Client-Side Architecture
The application MUST remain a static front end using plain HTML, CSS, and browser JavaScript.
Preserve the existing single-page shopping flow and keep code in its established file
responsibilities. Do not add a backend, database, authentication, order persistence, payment
processing, framework, or library unless an explicitly approved requirement makes it necessary.

### III. Reliable Shopping Journey
Preserve the Products -> Product Details -> Shopping Cart -> Checkout journey. Product selection,
cart quantities, displayed item totals, and order summaries MUST remain consistent with the
current cart state. Validate values used to update the cart and provide clear feedback for
invalid actions rather than silently presenting an incorrect total or order.

### IV. Responsive and Accessible UX
The shopping flow MUST work on desktop and mobile layouts. Interactive controls MUST have
meaningful accessible names and remain usable with keyboard navigation. Dynamic status or
confirmation feedback MUST be exposed accessibly, and visual changes MUST preserve readable
content and clear navigation.

### V. Verified, Minimal Changes
Changes MUST use small, readable functions and preserve existing behavior outside the requested
scope. A change to a user-visible flow MUST add or update the relevant Playwright coverage.
Before completing a behavior change, run `npm test` from the workspace root and report any
unresolved failure; documentation-only changes do not require that test run.

## Product and Technical Boundaries

The product is a static demonstration, not a production commerce service. User accounts,
authentication, real payment processing, server APIs, inventory management, shipping integrations,
and durable order storage are out of scope. Keep product and checkout behavior aligned with the
README, product requirements, and wireframes. Any proposed expansion beyond these boundaries
requires an explicit product decision before implementation.

## Development and Quality Gates

Keep the app runnable as a static site without new build infrastructure. Prefer browser-native
capabilities and existing dependencies; introduce a dependency only when a concrete requirement
cannot be met reasonably without it. For behavior changes, verify the affected journey with the
Playwright suite and update relevant product documentation when its stated behavior or scope
changes.

## Governance

This constitution governs product and technical decisions for the Fruit Storefront Prototype.
Every change and review MUST check alignment with these principles. If a requirement conflicts
with this constitution, resolve the conflict by amending the constitution or changing the
requirement before implementation; do not silently bypass a principle.

Amendments MUST be explicit and documented in this file. Use semantic versioning: increment MAJOR
for incompatible principle or scope changes, MINOR for new principles or material additions, and
PATCH for clarifications that do not change governance. Reviewers MUST consider user impact,
prototype boundaries, accessibility, and relevant test coverage when assessing compliance.

**Version**: 1.0.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09

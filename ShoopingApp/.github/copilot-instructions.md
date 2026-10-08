# Copilot Instructions for the Fruit Storefront Prototype

## Project overview
- This repo is a static storefront prototype built with plain HTML, CSS, and JavaScript.
- The application lives under the `ShoopingApp/` folder and does not use a backend, database, or framework.
- Keep changes aligned with the product behavior described in `ShoopingApp/README.md`, `ShoopingApp/VibeCodingPRD.md`, and the numbered wireframe files in the same directory.

## Key files and responsibilities
- `ShoopingApp/index.html`: app shell, sidebar navigation, and mount points.
- `ShoopingApp/app.js`: product catalog, cart state, navigation, rendering logic, and checkout behavior.
- `ShoopingApp/styles.css`: layout, visual styling, responsive rules, and toast / button appearance.
- `tests/app.spec.js`: Playwright smoke tests for the storefront flows.

## Working conventions
- Prefer small, readable functions and keep state updates explicit.
- Preserve the existing client-side architecture instead of introducing new dependencies or a framework.
- Maintain the current UX flow: Products -> Product Details -> Cart -> Checkout.
- Keep accessibility in mind: labels, button names, and ARIA status text should remain meaningful.
- If a change alters visible behavior, update or add the relevant Playwright test in `tests/app.spec.js`.

## Verification
- Run `npm test` from the workspace root to validate the storefront with Playwright.
- The local test server is configured in `playwright.config.js` and serves the app from `./ShoopingApp` on port `4173`.

## Guardrails
- Do not add backend APIs, authentication, or persistence.
- Do not introduce libraries unless the feature clearly requires them.
- Keep the implementation lightweight and consistent with the prototype's single-page storefront patterns.

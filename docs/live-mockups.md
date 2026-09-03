# Live Mockups

Product pages can include a local, interactive application preview without adding a backend or leaving the page.

## Add a demo through Markdown

Add the optional `liveMockup` object to a product entry in `src/content/products/`:

```yaml
liveMockup:
  appName: Tabellio
  title: Candidate desk
  eyebrow: INTERACTIVE DEMO / LOCAL DATA
  description: Explore the workflow in place.
  records:
    - id: signal-001
      title: Candidate ledger review
      type: Evidence
      owner: Avery
      status: active
      updated: 2m ago
```

The record demo supports `queued`, `active`, and `closed` statuses. Visitors can create, edit, search, filter, change status, delete, reset, and switch between desktop and mobile preview sizes. State exists only in the browser tab and disappears on reset or reload.

`ProductPage.astro` supplies the product accent and renders `LiveMockup.astro` only when this configuration exists. Future products can reuse the same container with their own app name, copy, and initial records; the host page does not need a new layout.

## Replace the app behavior

The container and styling live in `src/components/LiveMockup.astro`. The record behavior lives in `src/components/live-mockup/demo-state.mjs`. A future demo can keep the container and swap the state/rendering contract, or add a separate product-specific component at the conditional slot in `ProductPage.astro`.

Keep future demos local and bounded. Do not add authentication, production APIs, database writes, payment flows, or real customer data to a showcase mockup.

## Verify

```sh
npm run test:live-mockup
npm run build
```

The test script covers state transitions and the responsive embedding contract. Use the browser at `/projects/<slug>/#live-demo` for rendered keyboard, mobile-size, and visual checks.

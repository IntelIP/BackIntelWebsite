# Analytics

Analytics uses a small provider interface. It is disabled by default, adds no
OpenPanel package to the template, and emits no analytics script or network
call when `PUBLIC_ANALYTICS_PROVIDER=none`.

## Quick start: OpenPanel Cloud

Create an OpenPanel project, then set these values in the ignored `.env` file or
the deployment environment:

```sh
PUBLIC_ANALYTICS_PROVIDER=openpanel
PUBLIC_OPENPANEL_CLIENT_ID=replace-with-public-client-id
PUBLIC_OPENPANEL_API_URL=
PUBLIC_OPENPANEL_SCRIPT_URL=https://openpanel.dev/op1.js
PUBLIC_ANALYTICS_ENVIRONMENT=production
PUBLIC_ANALYTICS_REQUIRE_CONSENT=false
PUBLIC_ANALYTICS_RESPECT_DNT=true
```

The client ID is intended for browser use. Never put an OpenPanel server secret
in a `PUBLIC_*` variable. The build fails if OpenPanel is selected without a
client ID, or if a configured URL is not HTTP(S).

OpenPanel Cloud can use the default API host, so `PUBLIC_OPENPANEL_API_URL` may
remain empty. The template loads the official script asynchronously and sends
events through the provider adapter; it does not import `@openpanel/web`.

## Self-hosting

Keep the same provider and client ID, and point the browser adapter at the
self-hosted API endpoint:

```sh
PUBLIC_ANALYTICS_PROVIDER=openpanel
PUBLIC_OPENPANEL_CLIENT_ID=replace-with-public-client-id
PUBLIC_OPENPANEL_API_URL=https://analytics.example.com/api
PUBLIC_OPENPANEL_SCRIPT_URL=https://openpanel.dev/op1.js
```

Use the self-hosted instance's documented API path. If the script is served
from an approved internal asset host, set `PUBLIC_OPENPANEL_SCRIPT_URL` to that
absolute URL. Hosting, upgrades, retention, and access control remain separate
from this private template repository.

## Events

The shared contract lives in `src/analytics/measurement.ts`. It includes these
core events:

- `page_view`
- `cta_click`
- `signup_start`
- `signup_complete`
- `activation`
- `project:<event_name>` for a project-specific event

Every event carries `project`, `environment`, and `route` metadata. A page view
is sent when the enabled client starts, and the delegated browser listener
turns the existing solid CTA links into `cta_click` events. Product-specific
client code can use the measurement interface without knowing which provider
is active:

```ts
window.intelipAnalytics?.signupStart({ source: "hero" });
window.intelipAnalytics?.signupComplete({ plan: "starter" });
window.intelipAnalytics?.activation({ surface: "demo" });
window.intelipAnalytics?.project("demo_started", { surface: "live_mockup" });
```

Do not call `window.op` from shared components. Provider-specific calls belong
only in `src/analytics/openpanel.ts`.

## Consent and privacy signals

The browser client skips events when Do Not Track or Global Privacy Control is
active. Set `PUBLIC_ANALYTICS_RESPECT_DNT=false` only when the project's
privacy review explicitly supports that choice.

If a consent signal is present, a denied value always wins. A consent manager
can set either value before the analytics module runs:

```js
window.__INTELIP_ANALYTICS_CONSENT__ = "granted";
// or: document.documentElement.dataset.analyticsConsent = "denied";
```

For opt-in-only measurement, set `PUBLIC_ANALYTICS_REQUIRE_CONSENT=true`; the
client then waits for the `granted` signal and does nothing while consent is
unknown. In that mode OpenPanel's script is not added until consent is granted;
if consent is withdrawn while it loads, the pending script and event queue are
cancelled before the provider can initialize.
After changing the JavaScript signal, notify the client so it can activate:

```js
window.__INTELIP_ANALYTICS_CONSENT__ = "granted";
window.dispatchEvent(new CustomEvent("intelip:analytics-consent"));
```

Changes to `document.documentElement.dataset.analyticsConsent` are observed
automatically. Provider errors are converted to console warnings and never
block page rendering.

## Changing or adding providers

Shared layouts call `createAnalyticsProvider()` and the measurement interface
only. To add another provider, add an adapter in `src/analytics/`, extend the
validated provider union in `config.ts`, and update the provider factory. The
layout, product components, SEO, routes, and static output do not need to know
which provider is selected. Run `npm run test:analytics`, `npm run typecheck`,
and `npm run build` after the change.

OpenPanel measures browser activity. It is not a reliable scraper counter
because crawlers may not execute JavaScript; use approved edge/request logs for
bot and scrape analysis after Cloudflare is deliberately enabled.

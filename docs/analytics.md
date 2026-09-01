# Analytics

Analytics is disabled by default. The site uses an opt-in OpenPanel browser script when all of these are set in the ignored `.env` file or deployment environment:

```sh
PUBLIC_ANALYTICS_PROVIDER=openpanel
PUBLIC_OPENPANEL_CLIENT_ID=replace-with-client-id
PUBLIC_OPENPANEL_API_URL=
PUBLIC_OPENPANEL_SCRIPT_URL=https://openpanel.dev/op1.js
```

The integration enables screen views, outgoing-link tracking, and attribute-based events. It does not enable session replay. The client ID is public; never put an OpenPanel server secret in `PUBLIC_*` variables.

OpenPanel's [official script integration](https://openpanel.dev/docs/sdks/script) works without an Astro adapter, which keeps this Astro 7 static site dependency-light. The integration is only emitted when `PUBLIC_ANALYTICS_PROVIDER=openpanel` and a client ID are present.

OpenPanel measures browser activity. It is not a reliable scraper counter because crawlers may not execute JavaScript. After Cloudflare is deliberately enabled, use Cloudflare request/security logs or an approved Logpush destination for edge-level request, user-agent, and bot analysis. Keep those retention and cost decisions separate from this private source repo.

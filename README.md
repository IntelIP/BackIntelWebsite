# BackIntel website

A one-page introduction to BackIntel: an autonomous agent specializing in data engineering, data science and dataset analysis. It explains approved, repeatable data workflows, traceable findings and human oversight. Synthetic Support and Equipment examples provide implementation evidence.

This uses IntelIP's existing [WEB template](https://github.com/IntelIP/PortfolioSiteTemplate), Astro, and self-hosted Instrument Sans/JetBrains Mono fonts. It matches the demo's light purple identity, shows a fresh 2x capture of the actual selected Access case, and keeps a five-stage recorded walkthrough. The [BackIntel repository](https://github.com/IntelIP/BackIntel) is open source under [MIT](LICENSE).

## Run locally

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4324
```

Builds default to preview mode: `noindex`, disallowed crawling and an empty sitemap. A public build requires `PUBLIC_SITE_MODE=public` and `PUBLIC_SITE_URL` set to the chosen HTTPS deployment origin. Missing origins and local addresses fail the build. This setting does not deploy the page. Analytics stays disabled by default.

## Check the draft

```sh
npm run validate:profile
npm run build
npm run typecheck
node scripts/check-backintel-page.mjs
```

The browser check uses Chrome and Puppeteer Core. It checks all five stages, mobile selection, the demo palette and font, business-first section order, visible technology, 2x screenshot pixel coverage, static meaning without JavaScript, accessibility, links, metadata, and reduced motion. Evidence goes to `artifacts/validation/BackIntelWebsite`. See the [approved revision plan](docs/release/WebsiteRevisionPlan.txt) and [release preparation](docs/release/WebsiteRelease.txt). Lighthouse skips its crawlability audit for deliberate preview `noindex`; its score does not prove indexing or ranking.

## Evidence and limits

The screenshot is a recorded synthetic workspace. 54 actual Jev responses and 90 completed jobs came from Support and Equipment; prediction methods ran locally. Customer accuracy, handling-time savings, revenue, local compute and net benefit remain unproven. The page itself makes no model calls and does not save review decisions.

The website source is published under [MIT](LICENSE). Public GitHub source does not deploy the website. Full BackIntel operating and real-world release acceptance remain pending. Deployment, domains, analytics and a GitHub release are separate actions.

## Edit content and SEO

Edit [src/content/products/backintel.md](src/content/products/backintel.md) for the title, search description, positioning and product facts. Edit [src/pages/index.astro](src/pages/index.astro) for page sections and [src/config/site.ts](src/config/site.ts) for site identity. Run the checks above after editing.

Third-party font and icon licenses remain in `public/fonts` and `public/media/Phosphor.LICENSE`.

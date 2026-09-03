# IntelIP Portfolio Site Template

Reusable Astro product-kit for launching static product and project websites with a shared design language, SEO plumbing, accessible content structure, optional live mockups, and provider-based analytics.

## What this includes

- Static Astro pages with crawlable product URLs.
- Shared navigation, layout, typography, neutral color tokens, and accessibility hooks.
- Project content manifests in `src/content/products/`.
- Canonical metadata, Open Graph fields, `robots.txt`, `sitemap.xml`, `llms.txt`, and JSON-LD.
- Optional interactive live mockups with local-only demo state.
- Optional OpenPanel analytics, disabled by default.
- Guarded Cloudflare Pages packaging and deployment scripts.

## Quick start

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:4321/`. The sample portfolio is available at `/`, and sample product pages are under `/projects/`.

## Fork for a new project

1. Copy this repository into a private project repository.
2. Edit `src/config/site.ts` with the new site's name, description, and origin.
3. Replace or add Markdown manifests in `src/content/products/`.
4. Add product media under `public/media/` when a manifest references an image or video.
5. Set `visibility: public` only for pages ready to appear in navigation, the sitemap, and `llms.txt`.

Normal product launches require content edits only. The generated route, shared layout, metadata, structured data, and validation stay in the template.

Create a new manifest with:

```sh
npm run new:product -- product-slug
```

See [docs/product-kit.md](docs/product-kit.md) for the manifest contract and shared-skeleton map.

## Validate locally

```sh
npm run test:product-kit
npm run test:live-mockup
npm run test:analytics
npm run typecheck
PUBLIC_SITE_URL=https://your-domain.example npm run build
```

The build validator checks static HTML, heading structure, landmarks, metadata, JSON-LD, internal links, sitemap coverage, and `llms.txt` coverage. It does not require client-side JavaScript for the core page content.

The release accessibility target is Lighthouse accessibility `>= 0.90` on the approved public sample page. Retain the Lighthouse report with the candidate evidence when releasing.

## Analytics

Analytics is off by default:

```dotenv
PUBLIC_ANALYTICS_PROVIDER=none
```

To enable OpenPanel Cloud, set the public client ID and keep secrets out of `PUBLIC_*` variables:

```dotenv
PUBLIC_ANALYTICS_PROVIDER=openpanel
PUBLIC_OPENPANEL_CLIENT_ID=your-public-client-id
PUBLIC_OPENPANEL_API_URL=
PUBLIC_OPENPANEL_SCRIPT_URL=https://openpanel.dev/op1.js
```

Events go through the shared measurement interface. The provider supports page views, CTA clicks, signup milestones, activation, and custom project events. See [docs/analytics.md](docs/analytics.md) for consent, do-not-track, self-hosting, and provider details.

## Cloudflare Pages launch

Package the static output:

```sh
npm run package
```

For an explicitly authorized deployment, configure the ignored `.env` file or deployment environment with `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, and either an approved `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_USE_WRANGLER_AUTH=true`. Then set `CLOUDFLARE_DEPLOY_CONFIRM=DEPLOY` and run:

```sh
npm run deploy:cloudflare
```

The command is guarded and uses `dist/`; it does not create a project or configure DNS. See [infra/cloudflare-pages/README.md](infra/cloudflare-pages/README.md) for the Cloudflare workflow and Terraform notes.

## Project structure

```text
src/config/           Shared site and SEO configuration
src/content/products/ Project-specific Markdown manifests
src/components/       Shared page and live-mockup components
src/layouts/          Shared HTML shell and metadata
src/analytics/        Provider-neutral measurement layer
public/media/         Product images and videos
docs/                 Forking, design, SEO, analytics, and mockup guidance
infra/cloudflare-pages/ Cloudflare Pages infrastructure notes
```

## Documentation

- [Product kit guide](docs/product-kit.md)
- [Design language](docs/design-language.md)
- [SEO and agent discovery](docs/seo-and-agent-discovery.md)
- [Live mockups](docs/live-mockups.md)
- [Analytics](docs/analytics.md)
- [Rapid launch](docs/rapid-launch.md)

This repository is a template and local launch kit. It does not deploy, create DNS records, provision production resources, or enable analytics automatically.

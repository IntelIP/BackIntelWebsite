# Rapid launch workflow

PortfolioSite is a private, static Astro source repo. Content and media stay in Git; Cloudflare and analytics stay off until explicitly enabled.

## Daily loop

```sh
npm run dev
npm run new:product -- product-slug
npm run package
```

`new:product` creates a schema-complete private product entry from `templates/product.md`. Edit the Markdown frontmatter and body, add the matching media asset under `public/media/`, and set `visibility: public` only when the product is ready to be discoverable.

`package` runs the existing Astro build and static checks, then writes a compressed `dist/` artifact and SHA-256 manifest under the ignored `artifacts/releases/` directory.

## Cloudflare path

`infra/cloudflare-pages/` provisions the Pages project and optional domain association with Terraform. It does not connect GitHub or deploy code. `wrangler.jsonc` keeps the Pages output directory beside the source.

When deployment is approved, set the ignored `.env` values and run:

```sh
npm run deploy:cloudflare
```

The command refuses to run without `CLOUDFLARE_DEPLOY_CONFIRM=DEPLOY`, builds and packages first, then uses Wrangler Direct Upload for `dist/`. There is no deploy-on-push workflow.

Cloudflare's current Pages Direct Upload flow supports `wrangler pages deploy <DIRECTORY> --project-name=<PROJECT_NAME>`. See the [Cloudflare Direct Upload guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

## Domain path

The domain helper is intentionally read-only:

```sh
npm run domain:search -- intelip
npm run domain:check -- example.com example.dev
```

Search is candidate discovery. Check is the real-time availability/pricing step. There is no purchase command here. Cloudflare documents the Registrar API's search/check workflow and requires a separately approved Registrar write action for registration; see the [Registrar API guide](https://developers.cloudflare.com/registrar/registrar-api/) and [availability-check reference](https://developers.cloudflare.com/api/resources/registrar/methods/check/).

## Discovery surfaces

The site already generates `/robots.txt`, `/sitemap.xml`, and `/llms.txt`. Public product pages remain normal HTML pages with canonical metadata, JSON-LD, and visible product context. Keep claims in Markdown/HTML; media supports the explanation but does not replace it.

## Validation

```sh
npm run validate:profile
npm run validate:launch-kit
npm run build
```

These commands do not contact Cloudflare, a registrar, Neon, or an analytics service. CI validates the actual checked-out candidate and uploads the generated evidence; it does not deploy.

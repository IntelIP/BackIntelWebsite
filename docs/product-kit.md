# Product kit

PortfolioSite is a static Astro product kit. The shared skeleton owns routing, layout, navigation, design tokens, accessibility hooks, metadata, sitemap, robots rules, JSON-LD, and the optional live-demo container. Project content lives in Markdown manifests and media files.

## Fork and configure

1. Fork or clone this repository into a private project repository.
2. Run `npm ci` and `npm run dev`.
3. Update `src/config/site.ts` with the fork's site name and description.
4. Set `PUBLIC_SITE_URL` in the deployment environment. Keep it empty for local-only work.
5. Replace the sample entries in `src/content/products/`, or create one with:

```sh
npm run new:product -- product-slug
```

6. Edit the generated Markdown frontmatter and body. Add matching media under `public/media/`.
7. Keep `visibility: private` or `internal` until the page is approved. Use `visibility: public` to include it in the home page, sitemap, and `llms.txt`.

No page component changes are needed for a normal product. The route is generated from the content collection.

## Product manifest

Every product Markdown file must provide:

- identity: `code`, `name`, `kind`, `status`, `mark`, `accent`, `summary`, and `tags`;
- plain-English context: `description` with at least two sentences, `audience`, `problem`, and `solution`;
- page proof: `hero`, `meta`, `features`, `flow`, `proofPoints`, `quote`, and `cta`;
- preview media: `image`, `imageAlt`, `mediaType`, `mediaCaption`, `demoDuration`, and `demoStatus`;
- visibility: `visibility` and `featured`.

The `cta.href` value must be a relative anchor/path or an absolute HTTP(S) URL. Keep the Markdown body useful on its own: use visible headings, normal paragraphs, descriptive links, and source-backed claims. Do not put important product meaning only inside an image or interactive demo.

`liveMockup` is optional. Add it when a product needs a local interactive showcase; see [live mockups](./live-mockups.md).

## Shared skeleton map

| Surface | Location | Change when |
| --- | --- | --- |
| HTML shell and metadata | `src/layouts/Shell.astro` | the shared document contract changes |
| Product route | `src/pages/projects/[slug].astro` | the URL model changes |
| Product layout | `src/components/ProductPage.astro` | the shared page grammar changes |
| Content contract | `src/content.config.ts` | the manifest needs a new required field |
| Structured data | `src/config/seo.mjs` | JSON-LD types or relationships change |
| Product content | `src/content/products/*.md` | a product's facts, copy, or visibility changes |
| Product media | `public/media/*` | a product's visual proof changes |

## Validate and launch

Run the local contract before review:

```sh
npm run test:product-kit
PUBLIC_SITE_URL=https://your-domain.example npm run build
npm run test:live-mockup
```

The build validates static HTML, one H1 per page, landmarks, metadata, JSON-LD, internal page links, sitemap coverage, and `llms.txt` coverage. It also proves the page content exists in static output; the surrounding product page remains readable with JavaScript disabled.

Accessibility release target: Lighthouse accessibility score `>= 0.90` on the built public sample page. This repository keeps the deterministic semantic checks local; run Lighthouse in the approved CI/release environment where that tool is provisioned and retain the report with the candidate evidence.

When launch is approved, `npm run package` creates the release artifact. Terraform under `infra/cloudflare-pages/` prepares Cloudflare Pages configuration; `npm run deploy:cloudflare` remains an explicit, credential-gated action. Domain checks, analytics, and deployment are separate from content validation.

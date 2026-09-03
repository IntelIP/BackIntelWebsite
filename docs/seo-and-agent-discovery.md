# SEO and agent discovery

The site now ships a crawlable static baseline:

- Every public page has a unique title, description, robots directive, Open Graph metadata, and Twitter card metadata.
- `PUBLIC_SITE_URL` enables absolute canonical URLs and truthful absolute social metadata.
- Public product pages are linked from the home page and listed in `/sitemap.xml`.
- `/robots.txt` explicitly allows Google's normal wildcard crawl, OpenAI's `OAI-SearchBot` and `ChatGPT-User`, and Exa's `ExaSearchBot`.
- `/llms.txt` is a generated, compact index for services that choose to consume that convention.
- JSON-LD describes the public organization/site and product-page relationships on every rendered page; `PUBLIC_SITE_URL` makes the URLs absolute for publication.

## Before production launch

1. Set `PUBLIC_SITE_URL` to the real HTTPS origin in the Cloudflare build environment.
2. Confirm the deployed `robots.txt`, `sitemap.xml`, and `llms.txt` return `200` and contain the production origin.
3. Add the verified domain to Google Search Console and submit `/sitemap.xml`.
4. Check Cloudflare/WAF rules and rate limits do not block Googlebot, OAI-SearchBot, or ExaSearchBot.
5. Replace sample copy and illustrative media with approved product facts, screenshots, and demo video pages.
6. Keep important claims in visible HTML text; images and video support the explanation but do not replace it.

`llms.txt` is optional support for other systems. Google says it does not use that file for Search visibility or ranking, and Google AI features use the same foundational SEO requirements as normal Search. See the [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features), [Google developer SEO guide](https://developers.google.com/search/docs/fundamentals/get-started-developers), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), and [Exa crawler documentation](https://crawler.exa.ai/).

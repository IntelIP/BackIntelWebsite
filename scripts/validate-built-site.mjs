import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "dist");
const htmlRoutes = [
  "index.html",
  "projects/n10-ip/index.html",
  "projects/neural/index.html",
  "projects/tabellio/index.html",
];
const failures = [];

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`missing ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

for (const route of htmlRoutes) {
  const html = read(route);
  if (!html) continue;
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${route}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    failures.push(`${route}: missing description`);
  }
  if (!/<meta name="robots" content="[^"]+"/.test(html)) {
    failures.push(`${route}: missing robots directive`);
  }
  if (!/<meta property="og:title" content="[^"]+"/.test(html)) {
    failures.push(`${route}: missing Open Graph title`);
  }
  if (process.env.PUBLIC_SITE_URL?.trim() && !/<link rel="canonical" href="https?:\/\//.test(html)) {
    failures.push(`${route}: missing absolute canonical URL with PUBLIC_SITE_URL`);
  }
  if (process.env.PUBLIC_SITE_URL?.trim() && !html.includes('type="application/ld+json"')) {
    failures.push(`${route}: missing JSON-LD with PUBLIC_SITE_URL`);
  }
}

const robots = read("robots.txt");
for (const crawler of ["OAI-SearchBot", "ChatGPT-User", "ExaSearchBot"]) {
  if (!robots.includes(`User-agent: ${crawler}`)) failures.push(`robots.txt: missing ${crawler}`);
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== htmlRoutes.length) {
  failures.push(`sitemap.xml: expected ${htmlRoutes.length} URLs, found ${sitemapUrls.length}`);
}
if (sitemapUrls.some((url) => !/^https?:\/\//.test(url))) {
  failures.push("sitemap.xml: every URL must be absolute");
}

const llms = read("llms.txt");
for (const product of ["N10 IP", "Neural", "Tabellio"]) {
  if (!llms.includes(`### ${product}`)) failures.push(`llms.txt: missing ${product}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Built site surfaces valid: ${htmlRoutes.length} HTML pages, ${sitemapUrls.length} sitemap URLs.`);

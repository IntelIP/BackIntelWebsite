import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const root = join(process.cwd(), "dist");
const failures = [];

function collectHtml(directory, prefix = "") {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) return collectHtml(join(directory, entry.name), relativePath);
    return entry.name.endsWith(".html") && entry.name !== "404.html" ? [relativePath] : [];
  });
}

function read(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`missing ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function normalizeRelativePath(relativePath) {
  return relativePath.replaceAll("\\", "/");
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function routeForFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (normalized === "index.html") return "/";
  return "/" + normalized.replace(/\/index\.html$/, "/");
}

const htmlRoutes = collectHtml(root).map(normalizeRelativePath).sort();
const pagePaths = new Set(htmlRoutes.map(routeForFile));
const productRoutes = htmlRoutes.filter((route) => route.startsWith("projects/"));
const titles = new Set();
const analyticsProvider = process.env.PUBLIC_ANALYTICS_PROVIDER?.trim() || "none";
const analyticsScriptUrl =
  process.env.PUBLIC_OPENPANEL_SCRIPT_URL?.trim() || "https://openpanel.dev/op1.js";

if (!htmlRoutes.length) failures.push("dist: no HTML pages found");

for (const route of htmlRoutes) {
  const html = read(route);
  if (!html) continue;

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  if (!title) failures.push(`${route}: missing title`);
  else if (titles.has(title)) failures.push(`${route}: duplicate title ${title}`);
  else titles.add(title);

  if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${route}: missing description`);
  if (!/<meta name="robots" content="[^"]+"/.test(html)) failures.push(`${route}: missing robots directive`);
  if (!/<meta property="og:title" content="[^"]+"/.test(html)) failures.push(`${route}: missing Open Graph title`);
  for (const landmark of ["header", "main", "nav", "footer"]) {
    if (!new RegExp(`<${landmark}(?:\\s|>)`).test(html)) failures.push(`${route}: missing ${landmark} landmark`);
  }
  if (countMatches(html, /<h1(?:\s|>)/g) !== 1) failures.push(`${route}: expected exactly one H1`);

  const jsonLdSource = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!jsonLdSource) {
    failures.push(`${route}: missing JSON-LD`);
  } else {
    try {
      const jsonLd = JSON.parse(jsonLdSource);
      if (!Array.isArray(jsonLd) || !jsonLd.length) failures.push(`${route}: JSON-LD must be a non-empty array`);
      for (const item of jsonLd) {
        if (item?.["@context"] !== "https://schema.org" || typeof item?.["@type"] !== "string") {
          failures.push(`${route}: JSON-LD item missing schema context/type`);
        }
      }
    } catch {
      failures.push(`${route}: invalid JSON-LD`);
    }
  }

  const internalHrefs = [...html.matchAll(/href="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !/\.[a-z0-9]+(?:[?#]|$)/i.test(href));
  for (const href of internalHrefs) {
    const path = new URL(href, "https://validator.invalid").pathname;
    if (!pagePaths.has(path)) failures.push(`${route}: internal link has no built page: ${href}`);
  }

  if (route.startsWith("projects/")) {
    for (const phrase of ["Audience", "Problem", "Solution", "Product narrative"]) {
      if (!html.includes(phrase)) failures.push(`${route}: missing plain-English ${phrase} content`);
    }
  }

  if (analyticsProvider === "none" && /openpanel\.dev\/op1\.js|window\.op/.test(html)) {
    failures.push(`${route}: analytics is disabled but an OpenPanel bootstrap/script was emitted`);
  }
  if (analyticsProvider === "openpanel" && !html.includes(analyticsScriptUrl)) {
    failures.push(`${route}: enabled OpenPanel script is missing`);
  }
}

if (process.env.PUBLIC_SITE_URL?.trim()) {
  for (const route of htmlRoutes) {
    if (!/<link rel="canonical" href="https?:\/\//.test(read(route))) {
      failures.push(`${route}: missing absolute canonical URL with PUBLIC_SITE_URL`);
    }
  }
}

const robots = read("robots.txt");
for (const crawler of ["OAI-SearchBot", "ChatGPT-User", "ExaSearchBot"]) {
  if (!robots.includes(`User-agent: ${crawler}`)) failures.push(`robots.txt: missing ${crawler}`);
}
if (process.env.PUBLIC_SITE_URL?.trim() && !robots.includes("Sitemap:")) failures.push("robots.txt: missing sitemap link with PUBLIC_SITE_URL");

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== htmlRoutes.length) failures.push(`sitemap.xml: expected ${htmlRoutes.length} URLs, found ${sitemapUrls.length}`);
if (sitemapUrls.some((url) => !/^https?:\/\//.test(url))) failures.push("sitemap.xml: every URL must be absolute");
for (const path of pagePaths) {
  if (!sitemapUrls.some((url) => new URL(url).pathname === path)) failures.push(`sitemap.xml: missing page ${path}`);
}

const llms = read("llms.txt");
if (!llms.includes("## Projects")) failures.push("llms.txt: missing Projects index");
if (countMatches(llms, /^### /gm) !== productRoutes.length) failures.push(`llms.txt: expected ${productRoutes.length} product entries`);
for (const route of productRoutes) {
  const path = routeForFile(route);
  if (!llms.includes(path)) failures.push(`llms.txt: missing product URL ${path}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Built site surfaces valid: ${htmlRoutes.length} HTML pages, ${sitemapUrls.length} sitemap URLs, ${productRoutes.length} product pages.`);

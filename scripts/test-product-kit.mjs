import assert from "node:assert/strict";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildProductJsonLd, buildSiteJsonLd } from "../src/config/seo.mjs";

const root = process.cwd();
const evidencePath = join(root, "artifacts", "validation", "product-kit.json");
let evidenceStatus = "failed";
process.on("exit", () => {
  mkdirSync(join(root, "artifacts", "validation"), { recursive: true });
  writeFileSync(
    evidencePath,
    `${JSON.stringify({
      schemaVersion: "tabellio-validator-evidence/v0.1",
      validatorId: "product-kit-contract",
      status: evidenceStatus,
      summary: evidenceStatus === "passed" ? "Product manifests and SEO builders passed." : "Product kit contract failed.",
      metrics: [{ name: "manifests", value: manifestPaths?.length ?? 0, unit: "files" }],
      cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
      artifacts: [],
    }, null, 2)}\n`,
  );
});
const productDir = join(root, "src", "content", "products");
const manifestPaths = [
  join(root, "templates", "product.md"),
  ...readdirSync(productDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => join(productDir, name)),
];
const requiredFields = [
  "code",
  "name",
  "kind",
  "summary",
  "description",
  "audience",
  "problem",
  "solution",
  "features",
  "proofPoints",
  "cta",
];

function frontmatter(path) {
  const source = readFileSync(path, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${path}: missing frontmatter`);
  return match[1];
}

function topLevelValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}

function sentenceCount(value) {
  return value.split(/[.!?]+(?=\s|$)/).filter(Boolean).length;
}

const identities = new Set();
for (const path of manifestPaths) {
  const source = frontmatter(path);
  for (const field of requiredFields) assert.match(source, new RegExp(`^${field}:`, "m"), `${path}: missing ${field}`);
  const description = topLevelValue(source, "description");
  assert.ok(description && sentenceCount(description) >= 2, `${path}: description must contain at least two sentences`);
  assert.match(source, /^hero:\s*$/m, `${path}: missing hero manifest block`);
  assert.match(source, /^flow:\s*$/m, `${path}: missing flow manifest block`);
  if (source.match(/^liveMockup:\s*$/m)) assert.match(source, /^  records:\s*$/m, `${path}: liveMockup needs records`);

  if (!path.endsWith("templates/product.md")) {
    for (const key of ["code", "name", "seoTitle"]) {
      const value = topLevelValue(source, key);
      if (key === "seoTitle" && !value) continue;
      assert.ok(value && !identities.has(`${key}:${value}`), `${path}: duplicate ${key} ${value}`);
      identities.add(`${key}:${value}`);
    }
  }
}

const siteJsonLd = buildSiteJsonLd({ name: "Example", description: "Example site", url: "https://example.com/" });
assert.equal(siteJsonLd.length, 2, "site JSON-LD should include organization and website");
assert.deepEqual(siteJsonLd.map((item) => item["@type"]), ["Organization", "WebSite"]);

const productJsonLd = buildProductJsonLd({
  siteName: "Example",
  siteUrl: "https://example.com/",
  productUrl: "https://example.com/projects/sample/",
  product: { name: "Sample", kind: "Product platform", audience: "Teams", features: [{ title: "Feature" }] },
  title: "Sample | Example",
  description: "A sample product. A clear benefit.",
});
assert.equal(productJsonLd.length, 3, "product JSON-LD should include page, software, and breadcrumbs");
assert.deepEqual(productJsonLd.map((item) => item["@type"]), ["WebPage", "SoftwareApplication", "BreadcrumbList"]);
assert.deepEqual(productJsonLd[1].featureList, ["Feature"]);

evidenceStatus = "passed";
console.log(`Product kit manifests and SEO builders passed: ${manifestPaths.length} manifests.`);

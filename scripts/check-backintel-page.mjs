import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, extname, join } from "node:path";
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const output = "artifacts/validation/BackIntelWebsite";
mkdirSync(output, { recursive: true });
const dist = resolve("dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
function staticFile(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const file = resolve(dist, `.${pathname}`);
  if (file !== dist && !file.startsWith(`${dist}/`))
    throw new Error("Outside static directory");
  return statSync(file).isDirectory() ? join(file, "index.html") : file;
}
const server = createServer((req, res) => {
  try {
    const file = staticFile(req.url);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
    });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const executablePath =
  process.env.CHROME_PATH ||
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync);
const report = {
  status: "failed",
  validated_at: new Date().toISOString(),
  candidate: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  candidate_scope: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() ? "uncommitted-working-tree" : "committed-candidate",
  exact_commit_readiness: "blocked",
  viewports: [],
  stages: [],
  errors: [],
  screenshots: [],
  screenshot_captures: [],
  new_model_calls: 0,
  external_requests: [],
  reduced_motion: false,
  static_meaning: false,
};
let browser;
try {
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") report.errors.push(msg.text());
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      !request.url().startsWith(`${origin}/`) &&
      !request.url().startsWith("data:")
    ) {
      report.external_requests.push(request.url());
      request.abort();
    } else request.continue();
  });
  const stageTitles = [
    "A customer cannot access",
    "Turn a report",
    "Compare before choosing",
    "A corrected report",
    "The reviewer keeps",
  ];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewport({ width, height: 1000, deviceScaleFactor: 2 });
    await page.goto(origin, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.$eval(".bi-workspace-shot", (node) => node.scrollIntoView());
    await page.waitForFunction(() => {
      const image = document.querySelector(".bi-workspace-shot");
      return image.complete && image.naturalWidth > 0;
    });
    for (let i = 0; i < stageTitles.length; i++) {
      if (width <= 600) await page.select("[data-stage-select]", String(i));
      else await page.click(`button[data-step="${i}"]`);
      await page.evaluate(async () => {
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished),
        );
      });
      assert(
        (
          await page.$eval("[data-stage-title]", (node) => node.textContent)
        ).includes(stageTitles[i]),
      );
      assert.equal(
        await page.$$eval(
          'button[aria-pressed="true"]',
          (nodes) => nodes.length,
        ),
        1,
      );
      if (width === 1440) {
        const screenshot = `${output}/Stage${i + 1}.png`;
        await (await page.$(".bi-demo")).screenshot({ path: screenshot });
        report.screenshots.push(screenshot);
        report.stages.push({ stage: i + 1, status: "passed" });
      }
    }
    if (width <= 600) await page.select("[data-stage-select]", "0");
    else await page.click('button[data-step="0"]');
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    const violations = await page.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target),
      })),
    );
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      fontsLoaded:
        document.fonts.check('14px "Instrument Sans"') &&
        document.fonts.check('600 14px "Instrument Sans"'),
      fontFamily: getComputedStyle(document.querySelector(".bi-page"))
        .fontFamily,
      accent: getComputedStyle(document.querySelector(".bi-page"))
        .getPropertyValue("--bi-accent")
        .trim(),
      canvas: getComputedStyle(document.querySelector(".bi-page"))
        .getPropertyValue("--bi-canvas")
        .trim(),
      workspaceImageWidth:
        document.querySelector(".bi-workspace-shot").naturalWidth,
      workspaceRenderedWidth: document
        .querySelector(".bi-workspace-shot")
        .getBoundingClientRect().width,
      deviceScaleFactor: devicePixelRatio,
      pixelCoverage:
        document.querySelector(".bi-workspace-shot").naturalWidth /
        (document.querySelector(".bi-workspace-shot").getBoundingClientRect()
          .width *
          devicePixelRatio),
      headerGithubRightGap:
        document.querySelector(".bi-header").getBoundingClientRect().right -
        document
          .querySelector(".bi-header > .bi-button")
          .getBoundingClientRect().right,
      brokenImages: [...document.images].filter(
        (image) => !image.complete || !image.naturalWidth,
      ).length,
    }));
    report.viewports.push({
      width,
      ...layout,
      accessibility_violations: violations,
    });
    assert.equal(layout.overflow, false, `Horizontal overflow at ${width}`);
    assert.equal(layout.fontsLoaded, true);
    assert(layout.fontFamily.includes("Instrument Sans"));
    assert.equal(layout.accent, "#7450d3");
    assert.equal(layout.canvas, "#fafafd");
    assert.equal(
      layout.workspaceImageWidth,
      width === 320 ? 576 : width === 390 ? 716 : 2560,
    );
    assert.equal(layout.deviceScaleFactor, 2);
    assert(
      layout.pixelCoverage >= 1,
      `Screenshot lacks DPR2 pixels at ${width}`,
    );
    if (width <= 600)
      assert.equal(
        Math.round(layout.workspaceRenderedWidth),
        width - 32,
        "Phone case capture must use the available width",
      );
    assert.equal(layout.brokenImages, 0);
    assert(
      Math.abs(layout.headerGithubRightGap) <= 1,
      `GitHub must stay at the top right at ${width}`,
    );
    assert.equal(violations.length, 0, JSON.stringify(violations));
    await page.evaluate(() => scrollTo(0, 0));
    // Keep very tall phone overviews below browser bitmap limits. The phone
    // quality checks and focused captures use DPR2 independently.
    if (width <= 600)
      await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
    const screenshot = `${output}/Page${width}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    report.screenshots.push(screenshot);
    report.screenshot_captures.push({
      file: screenshot,
      deviceScaleFactor: width <= 600 ? 1 : 2,
      purpose: "page overview",
    });
    if (width <= 600) {
      await page.setViewport({ width, height: 1000, deviceScaleFactor: 2 });
      await page.evaluate(() => scrollTo(0, 0));
      const opening = `${output}/Opening${width}.png`;
      await page.screenshot({ path: opening });
      report.screenshots.push(opening);
      const headings = await page.$$eval(".bi-problems h3", (nodes) =>
        nodes.map((node) => node.innerText),
      );
      assert(
        headings.every((text) => !/\.[A-Z]/.test(text)),
        "Mobile pain headings need sentence spacing",
      );
      await page.evaluate(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
      const closing = `${output}/Closing${width}.png`;
      await page.screenshot({ path: closing });
      report.screenshots.push(closing);
      report.screenshot_captures.push(
        { file: opening, deviceScaleFactor: 2, purpose: "phone opening" },
        {
          file: closing,
          deviceScaleFactor: 2,
          purpose: "phone pilot invitation and footer",
        },
      );
      assert(
        await page.$eval(
          ".bi-footer",
          (node) => node.getBoundingClientRect().bottom <= innerHeight + 1,
        ),
      );
    }
    if (width === 1440) {
      await page.screenshot({ path: `${output}/Opening1440.png` });
      report.screenshots.push(`${output}/Opening1440.png`);
      for (const [selector, name] of [
        [".bi-output-section", "Packet"],
        ["#workflow", "Technology"],
      ]) {
        const screenshot = `${output}/${name}1440.png`;
        await (await page.$(selector)).screenshot({ path: screenshot });
        report.screenshots.push(screenshot);
      }
    }
  }
  report.positioning = await page.evaluate(() => ({
    headline: document
      .querySelector("h1")
      .innerText.replace(/\s+/g, " ")
      .trim(),
    journey: [...document.querySelectorAll("main > section")].map(
      (node) => node.id || node.getAttribute("aria-labelledby"),
    ),
    technology: [...document.querySelectorAll(".bi-flow-tech")].map(
      (node) => node.textContent,
    ),
    workflowVisible: Boolean(
      document
        .querySelector("#workflow")
        .innerText.includes("Aegra owns scheduling"),
    ),
    heroLead: document.querySelector(".bi-lead").innerText,
    heroLinks: document.querySelectorAll(".bi-hero-copy a").length,
    heroNotes: document.querySelectorAll(".bi-hero-copy .bi-note").length,
    headerNavLinks: [...document.querySelectorAll(".bi-header nav a")].map(
      (node) => node.textContent,
    ),
    headerAction: document
      .querySelector(".bi-header > .bi-button")
      .getAttribute("href"),
    headerActionText: document.querySelector(".bi-header > .bi-button")
      .innerText,
  }));
  assert.equal(
    report.positioning.headline,
    "Autonomous intelligence for your data workflows.",
  );
  assert.deepEqual(report.positioning.journey.slice(1, 6), [
    "problem",
    "output",
    "workflow",
    "use-cases",
    "demo-title",
  ]);
  assert.deepEqual(report.positioning.technology, [
    "Python / PostgreSQL",
    "Jev",
    "CatBoost / TabICLv2",
    "LangGraph / Aegra",
    "React / optional Reflex",
  ]);
  assert(report.positioning.workflowVisible);
  assert.equal(
    report.positioning.heroLead,
    "BackIntel is an autonomous agent specializing in data engineering, data science and dataset analysis. It prepares data, compares models and refreshes findings through repeatable workflows, with traceable evidence and human oversight.",
  );
  assert.equal(report.positioning.heroLinks, 0);
  assert.equal(report.positioning.heroNotes, 0);
  assert.deepEqual(report.positioning.headerNavLinks, [
    "Technology",
    "Workflows",
  ]);
  assert.equal(
    report.positioning.headerAction,
    "https://github.com/IntelIP/BackIntel",
  );
  assert(report.positioning.headerActionText.includes("View on GitHub"));
  await page.setViewport({ width: 1141, height: 854, deviceScaleFactor: 2 });
  await page.goto(origin, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/Opening1141.png` });
  report.screenshots.push(`${output}/Opening1141.png`);
  report.selected_viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
    headerGithubRightGap:
      document.querySelector(".bi-header").getBoundingClientRect().right -
      document.querySelector(".bi-header > .bi-button").getBoundingClientRect()
        .right,
  }));
  assert.equal(report.selected_viewport.overflow, false);
  assert(Math.abs(report.selected_viewport.headerGithubRightGap) <= 1);
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.setViewport({ width: 768, height: 1000 });
  await page.focus('button[data-step="1"]');
  await page.keyboard.press("Enter");
  assert.equal(
    await page.$eval('button[data-step="1"]', (node) =>
      node.getAttribute("aria-pressed"),
    ),
    "true",
  );
  report.reduced_motion = await page.evaluate(
    () =>
      document.getAnimations().length === 0 &&
      getComputedStyle(document.querySelector(".bi-button"))
        .transitionDuration === "0s",
  );
  assert(report.reduced_motion);
  assert(
    (
      await page.$eval("[data-stage-title]", (node) => node.textContent)
    ).includes("Turn a report"),
  );
  await page.click(".bi-evidence-details summary");
  assert.equal(
    await page.$eval(".bi-evidence-details", (node) => node.open),
    true,
  );
  const links = await page.$$eval('a[href^="#"]', (nodes) =>
    nodes.map((node) => ({
      href: node.getAttribute("href"),
      present: Boolean(document.querySelector(node.getAttribute("href"))),
    })),
  );
  assert(
    links.every((link) => link.present),
    JSON.stringify(links),
  );
  const guide = await fetch(`${origin}/demo-guide.txt`);
  assert.equal(guide.status, 200);
  assert((await guide.text()).includes("Python 3.10+"));
  const metadata = await page.evaluate(() => ({
    h1Count: document.querySelectorAll("h1").length,
    canonical: document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href"),
    title: document.title,
    robots: document
      .querySelector('meta[name="robots"]')
      ?.getAttribute("content"),
    socialImage: document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content"),
    description: document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content"),
    jsonLd: JSON.parse(
      document.querySelector('script[type="application/ld+json"]').textContent,
    ),
  }));
  assert.equal(metadata.h1Count, 1);
  assert(metadata.title.includes("BackIntel"));
  assert.equal(metadata.title, "BackIntel | Autonomous AI for Data Workflows");
  assert.equal(
    metadata.description,
    "An autonomous agent for data engineering, data science and dataset analysis. Prepare data, compare models and keep workflow results current with human oversight.",
  );
  assert.equal(
    metadata.canonical,
    process.env.PUBLIC_SITE_URL
      ? `${process.env.PUBLIC_SITE_URL.replace(/\/$/, "")}/`
      : undefined,
  );
  assert.equal(metadata.jsonLd[1].applicationCategory, "BusinessApplication");
  assert(!metadata.jsonLd.some((item) => item["@type"] === "BreadcrumbList"));
  assert(
    metadata.robots.includes(
      process.env.PUBLIC_SITE_MODE === "public"
        ? "index, follow"
        : "noindex, nofollow",
    ),
  );
  if (metadata.canonical)
    assert(metadata.socialImage.endsWith("/media/backintel-social.png"));
  const repositoryLinks = await page.$$eval(
    'a[href="https://github.com/IntelIP/BackIntel"]',
    (nodes) => nodes.length,
  );
  assert.equal(
    repositoryLinks,
    3,
    "GitHub belongs at the header right, developer area and footer",
  );
  const social = await fetch(`${origin}/media/backintel-social.png`);
  assert.equal(social.status, 200);
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  if (process.env.PUBLIC_SITE_MODE !== "public") {
    assert(!sitemap.includes("<loc>"));
    assert(robots.includes("Disallow: /"));
  }
  report.metadata = metadata;
  await page.setJavaScriptEnabled(false);
  await page.goto(origin, { waitUntil: "networkidle0" });
  await page.click(".bi-evidence-details summary");
  const text = await page.$eval("main", (node) => node.innerText);
  report.static_meaning =
    text.includes("54") &&
    text.includes("90") &&
    text.includes("MIT license") &&
    text.includes("Scattered information") &&
    text.includes("decision packet") &&
    text.includes("Aegra owns scheduling") &&
    text.includes("typed observation") &&
    text.includes("Every update restarts") &&
    text.toLowerCase().includes("customer accuracy") &&
    text.includes("BackIntel is open source");
  assert(report.static_meaning);
  assert.equal(report.external_requests.length, 0);
  assert.equal(report.errors.length, 0, report.errors.join("; "));
  report.status = "passed";
  if (report.candidate_scope === "committed-candidate") report.exact_commit_readiness = "passed";
} catch (error) {
  report.errors.push(error.message);
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
  report.screenshot_digests = report.screenshots.map((file) => ({
    file,
    sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
  }));
  Object.assign(report, {
    schemaVersion: "tabellio-validator-evidence/v0.1",
    validatorId: "backintel-browser",
    summary:
      "Recorded walkthrough, responsive layout, accessibility and static meaning checks.",
    metrics: [
      {
        name: "viewport_count",
        value: report.viewports.length,
        unit: "viewports",
      },
      {
        name: "external_request_count",
        value: report.external_requests.length,
        unit: "requests",
      },
    ],
    cost: {
      telemetry: "not_applicable",
      usd: null,
      modelCalls: 0,
      toolCalls: null,
    },
    artifacts: report.screenshot_digests.map(({ file, sha256 }) => ({
      name: file,
      uri: `file://${resolve(file)}`,
      digest: sha256,
      mediaType: "image/png",
      bytes: statSync(file).size,
    })),
  });
  writeFileSync(
    `${output}/Browser.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(
  JSON.stringify({
    status: report.status,
    viewports: report.viewports.map(({ width }) => width),
    stages: report.stages.length,
    screenshots: report.screenshots.length,
    errors: report.errors,
    exact_commit_readiness: report.exact_commit_readiness,
  }),
);
if (report.status !== "passed") process.exitCode = 1;

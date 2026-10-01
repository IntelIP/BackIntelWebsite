import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

// A fresh application capture in a social layout; no invented workspace outputs.
const data = (file, mime) =>
  `data:${mime};base64,${readFileSync(file).toString("base64")}`;
const colors = JSON.parse(readFileSync("design/product.design.json", "utf8"))
  .tokens.color.light;
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Instrument;src:url('${data("public/fonts/instrument-sans-latin-600-normal.woff2", "font/woff2")}');font-weight:600}
    *{box-sizing:border-box}body{margin:0;background:${colors.canvas};color:${colors.text};font-family:Instrument,sans-serif}
    header{display:flex;align-items:center;gap:12px;padding:38px 48px;font-size:28px;font-weight:600}
    header img{width:40px;height:40px}.content{display:grid;grid-template-columns:420px 1fr;gap:32px;padding:0 48px}
    h1{margin:48px 0 24px;font-size:54px;line-height:1.13;font-weight:600}h1 span{color:${colors.accent}}
    p{font-size:20px;line-height:1.5;color:${colors.textMuted}}.workspace{height:470px;border:1px solid ${colors.border};border-radius:6px;overflow:hidden;background:${colors.surface};position:relative}
    .workspace>img{width:100%;display:block}.label{position:absolute;bottom:0;left:0;right:0;padding:16px;background:${colors.navigation};border-top:1px solid ${colors.border};font-size:15px;color:${colors.textMuted}}
  </style></head><body><header><img src="${data("public/favicon.svg", "image/svg+xml")}"/>BackIntel</header><div class="content"><div><h1>Autonomous intelligence.<br/><span>For data workflows.</span></h1><p>Data engineering<br/>Data science · Dataset analysis</p></div><div class="workspace"><img src="${data("public/media/access-review.png", "image/png")}"/><div class="label">Actual Access case · Synthetic example</div></div></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/media/backintel-social.png" });
} finally {
  await browser.close();
}

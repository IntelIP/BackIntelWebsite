import { spawnSync } from "node:child_process";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT?.trim();
const useWranglerAuth =
  process.env.CLOUDFLARE_USE_WRANGLER_AUTH?.trim().toLowerCase() === "true";
const confirmation = process.env.CLOUDFLARE_DEPLOY_CONFIRM?.trim();
const branch = process.env.CLOUDFLARE_PAGES_BRANCH?.trim();

if (!accountId || !projectName || (!apiToken && !useWranglerAuth)) {
  console.error(
    "Deploy blocked: set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_PAGES_PROJECT, and either CLOUDFLARE_API_TOKEN or CLOUDFLARE_USE_WRANGLER_AUTH=true in the ignored .env file or environment.",
  );
  process.exit(1);
}

if (confirmation !== "DEPLOY") {
  console.error(
    'Deploy blocked: set CLOUDFLARE_DEPLOY_CONFIRM=DEPLOY when you explicitly intend to publish this build.',
  );
  process.exit(1);
}

const packageResult = spawnSync(process.execPath, ["scripts/package-site.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (packageResult.error || packageResult.status !== 0) {
  process.exit(packageResult.error ? 1 : packageResult.status ?? 1);
}

const headResult = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const commitHash = headResult.status === 0 ? headResult.stdout.trim() : "";
const args = [
  "--yes",
  "wrangler@latest",
  "pages",
  "deploy",
  "dist",
  "--project-name",
  projectName,
];

if (commitHash) args.push("--commit-hash", commitHash);
if (branch) args.push("--branch", branch);

console.log(`Publishing dist/ to Cloudflare Pages project ${projectName}.`);
const deployEnvironment = { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId };
if (apiToken) deployEnvironment.CLOUDFLARE_API_TOKEN = apiToken;
else delete deployEnvironment.CLOUDFLARE_API_TOKEN;
const deployResult = spawnSync("npx", args, {
  cwd: process.cwd(),
  env: deployEnvironment,
  stdio: "inherit",
});

if (deployResult.error || deployResult.status !== 0) {
  process.exit(deployResult.error ? 1 : deployResult.status ?? 1);
}

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidenceDir = join(root, "artifacts", "validation");
const checks = [];

function record(id, passed, detail) {
  checks.push({ id, status: passed ? "passed" : "failed", detail });
}

const requiredFiles = [
  "wrangler.jsonc",
  "templates/product.md",
  "infra/cloudflare-pages/main.tf",
  "infra/cloudflare-pages/variables.tf",
  "infra/cloudflare-pages/outputs.tf",
  "infra/cloudflare-pages/versions.tf",
];

for (const file of requiredFiles) {
  record(`file:${file}`, existsSync(join(root, file)), "required launch-kit file");
}

const scripts = [
  "scripts/package-site.mjs",
  "scripts/deploy-cloudflare.mjs",
  "scripts/new-product.mjs",
  "scripts/domains.mjs",
];

for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
  });
  record(`syntax:${file}`, result.status === 0, (result.stderr || "syntax check").trim());
}

const terraformResult = spawnSync("terraform", ["fmt", "-check", "-recursive", "infra/cloudflare-pages"], {
  cwd: root,
  encoding: "utf8",
});
record(
  "terraform-format",
  terraformResult.status === 0,
  (terraformResult.stdout || terraformResult.stderr || "terraform fmt check").trim(),
);

const status = checks.every((check) => check.status === "passed") ? "passed" : "failed";
const gitResult = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const evidence = {
  schemaVersion: "portfolio-launch-kit-validation/v1",
  status,
  commit: gitResult.status === 0 ? gitResult.stdout.trim() : null,
  externalActions: { cloudflare: false, registrar: false, analytics: false, network: false },
  checks,
};

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(join(evidenceDir, "launch-kit.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
process.exit(status === "passed" ? 0 : 1);

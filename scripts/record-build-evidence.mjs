import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const artifactsDir = path.join(root, "..", "artifacts", "validation");
const logPath = path.join(artifactsDir, "astro-build.log");
const evidencePath = path.join(artifactsDir, "astro-build.json");
const exitCode = Number(process.argv[2] ?? "1");
const logExists = existsSync(logPath);
const log = logExists ? readFileSync(logPath) : Buffer.from("");
const status = !logExists ? "blocked" : exitCode === 0 ? "passed" : "failed";
const head = (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "uncommitted";
  }
})();

mkdirSync(artifactsDir, { recursive: true });
writeFileSync(
  evidencePath,
  `${JSON.stringify(
    {
      schemaVersion: "tabellio-validator-evidence/v0.1",
      validatorId: "astro-static-build",
      status,
      summary:
        status === "passed"
          ? `Astro static build passed at candidate ${head}.`
          : status === "failed"
            ? `Astro static build exited with code ${exitCode} at candidate ${head}.`
            : `Astro build evidence is blocked because ${logPath} is missing.`,
      metrics: [{ name: "exit_code", value: exitCode, unit: "code" }],
      cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
      artifacts: logExists
        ? [
            {
              name: "astro-build.log",
              uri: `https://artifacts.example.invalid/portfolio-site/sha256/${createHash("sha256").update(log).digest("hex")}`,
              digest: createHash("sha256").update(log).digest("hex"),
              mediaType: "text/plain",
              bytes: log.byteLength,
            },
          ]
        : [],
    },
    null,
    2,
  )}\n`,
);

process.exit(status === "passed" ? 0 : status === "failed" ? exitCode || 1 : 2);

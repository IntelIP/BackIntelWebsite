import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "astro.cmd" : "astro";
const args = ["check"];
const result = spawnSync(command, args, { encoding: "utf8" });
const status = result.status ?? 1;

mkdirSync("artifacts/validation", { recursive: true });
writeFileSync(
  "artifacts/validation/typecheck.json",
  `${JSON.stringify(
    {
      schemaVersion: "tabellio-validator-evidence/v0.1",
      validatorId: "astro-typecheck",
      status: status === 0 ? "passed" : "failed",
      summary: status === 0
        ? "Astro typecheck passed."
        : `Astro typecheck failed with exit code ${status}.`,
      metrics: [{ name: "exit_code", value: status, unit: "code" }],
      cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
      artifacts: [],
    },
    null,
    2,
  )}\n`,
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(status);

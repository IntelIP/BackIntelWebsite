import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const artifactsDir = join(root, "artifacts", "validation");
const logPath = join(artifactsDir, "astro-build.log");
const commands = [
  ["npm", ["ci", "--ignore-scripts"]],
  ["npm", ["run", "build"]],
];
const output = [];
let exitCode = 0;

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  output.push(`$ ${command} ${args.join(" ")}\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  if (result.error || result.status !== 0) {
    exitCode = result.error ? 1 : result.status ?? 1;
    break;
  }
}

mkdirSync(artifactsDir, { recursive: true });
writeFileSync(logPath, `${output.join("\n")}\n`);

const recordResult = spawnSync(process.execPath, ["scripts/record-build-evidence.mjs", String(exitCode)], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});

if (exitCode === 0 && (recordResult.error || recordResult.status !== 0)) {
  process.exit(1);
}

process.exit(exitCode);

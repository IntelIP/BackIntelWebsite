import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const distPath = join(root, "dist");
const releasesPath = join(root, "artifacts", "releases");

const buildResult = spawnSync("npm", ["run", "build"], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});

if (buildResult.error || buildResult.status !== 0) {
  process.exit(buildResult.error ? 1 : buildResult.status ?? 1);
}

if (!existsSync(distPath)) {
  console.error("Package failed: Astro did not produce dist/.");
  process.exit(1);
}

const gitResult = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
});
const commit = gitResult.status === 0 ? gitResult.stdout.trim() : null;
const workingTreeResult = spawnSync("git", ["status", "--porcelain=v1"], {
  cwd: root,
  encoding: "utf8",
});
const workingTreeDirty = workingTreeResult.status !== 0 || Boolean(workingTreeResult.stdout.trim());
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const candidateId = workingTreeDirty ? `working-tree-${commit?.slice(0, 12) ?? "unknown"}` : commit?.slice(0, 12) ?? "working-tree";
const releaseId = `portfolio-site-${candidateId}-${timestamp}`;
const archivePath = join(releasesPath, `${releaseId}.tar.gz`);
const manifestPath = join(releasesPath, `${releaseId}.json`);

mkdirSync(releasesPath, { recursive: true });
const archiveResult = spawnSync("tar", ["-czf", archivePath, "-C", distPath, "."], {
  cwd: root,
  encoding: "utf8",
});

if (archiveResult.error || archiveResult.status !== 0) {
  console.error(archiveResult.stderr || "Package failed: tar could not create the release archive.");
  process.exit(archiveResult.error ? 1 : archiveResult.status ?? 1);
}

const archiveBytes = readFileSync(archivePath);
const manifest = {
  schemaVersion: "portfolio-release/v1",
  project: "portfolio-site",
  status: "ready-for-deploy",
  createdAt: new Date().toISOString(),
  commit,
  workingTreeDirty,
  outputDirectory: "dist",
  archive: relative(root, archivePath),
  bytes: statSync(archivePath).size,
  sha256: createHash("sha256").update(archiveBytes).digest("hex"),
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Packaged ${manifest.archive}`);
console.log(`SHA-256 ${manifest.sha256}`);

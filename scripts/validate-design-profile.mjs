import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const profilePath = path.join(root, "..", "design", "product.design.json");
const evidencePath = path.join(root, "..", "artifacts", "validation", "design-profile.json");
const requiredKeys = [
  "product",
  "version",
  "status",
  "visualThesis",
  "tokens",
  "productAccents",
  "componentPolicy",
  "requiredStates",
  "requiredViewports",
  "validation",
];

const errors = [];
let profile = null;
let profileBytes = 0;
let profileDigest = "";

try {
  const raw = readFileSync(profilePath);
  profileBytes = raw.byteLength;
  profileDigest = createHash("sha256").update(raw).digest("hex");
  profile = JSON.parse(raw.toString("utf8"));
} catch (error) {
  errors.push(`profile could not be read or parsed: ${error.message}`);
}

if (profile && (typeof profile !== "object" || Array.isArray(profile))) {
  errors.push("profile root must be an object");
}

if (profile && typeof profile === "object" && !Array.isArray(profile)) {
  for (const key of requiredKeys) {
    if (!(key in profile)) errors.push(`missing required key: ${key}`);
  }

  if (typeof profile.visualThesis !== "string" || profile.visualThesis.trim() === "") {
    errors.push("visualThesis must be a non-empty string");
  }

  const neutral = profile.tokens?.color?.light;
  for (const key of ["canvas", "surface", "border", "text", "textMuted"]) {
    if (typeof neutral?.[key] !== "string") errors.push(`missing light neutral token: ${key}`);
  }

  if (!Array.isArray(profile.requiredStates) || profile.requiredStates.length === 0) {
    errors.push("requiredStates must be a non-empty array");
  }
  if (!Array.isArray(profile.requiredViewports) || profile.requiredViewports.length === 0) {
    errors.push("requiredViewports must be a non-empty array");
  }
}

const status = errors.length === 0 ? "passed" : "failed";
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

mkdirSync(path.dirname(evidencePath), { recursive: true });
writeFileSync(
  evidencePath,
  `${JSON.stringify(
    {
      schemaVersion: "tabellio-validator-evidence/v0.1",
      validatorId: "design-profile-schema",
      status,
      summary:
        status === "passed"
          ? `Design profile is valid at candidate ${head}.`
          : `Design profile failed ${errors.length} deterministic check(s): ${errors.join("; ")}`,
      metrics: [
        { name: "required_keys_present", value: requiredKeys.length - errors.filter((error) => error.startsWith("missing required key")).length, unit: "keys" },
        { name: "profile_bytes", value: profileBytes, unit: "bytes" },
      ],
      cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
      artifacts: profileDigest
        ? [
            {
              name: "product.design.json",
              uri: `https://artifacts.example.invalid/portfolio-site/sha256/${profileDigest}`,
              digest: profileDigest,
              mediaType: "application/json",
              bytes: profileBytes,
            },
          ]
        : [],
    },
    null,
    2,
  )}\n`,
);

if (status !== "passed") process.exit(1);

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createDemoState,
  createRecord,
  deleteRecord,
  INITIAL_RECORDS,
  resetDemo,
  setFilter,
  setQuery,
  updateRecord,
  updateStatus,
  visibleRecords,
} from "../src/components/live-mockup/demo-state.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(root, "..", "src", "components", "LiveMockup.astro");
const evidencePath = path.join(root, "..", "artifacts", "validation", "live-mockup.json");
const checks = [];

function test(id, callback) {
  try {
    callback();
    checks.push({ id, status: "passed" });
  } catch (error) {
    checks.push({ id, status: "failed", detail: error.message });
  }
}

test("create-record", () => {
  const state = createDemoState();
  const next = createRecord(state, { title: "New review", type: "Product", owner: "Mina", status: "active" });
  assert.equal(next.records.length, state.records.length + 1);
  assert.equal(next.records.at(-1).title, "New review");
  assert.equal(next.records.at(-1).status, "active");
});

test("edit-record", () => {
  const state = createDemoState();
  const next = updateRecord(state, "signal-001", { title: "Updated review", owner: "Jon" });
  assert.equal(next.records.find((record) => record.id === "signal-001").title, "Updated review");
  assert.equal(next.records.find((record) => record.id === "signal-001").owner, "Jon");
});

test("filter-and-search", () => {
  let state = createDemoState();
  state = setFilter(state, "active");
  assert.equal(visibleRecords(state).length, 2);
  state = setQuery(state, "acceptance");
  assert.equal(visibleRecords(state).length, 1);
});

test("change-status", () => {
  const next = updateStatus(createDemoState(), "signal-002", "active");
  assert.equal(next.records.find((record) => record.id === "signal-002").status, "active");
});

test("delete-record", () => {
  const next = deleteRecord(createDemoState(), "signal-003");
  assert.equal(next.records.length, INITIAL_RECORDS.length - 1);
  assert.equal(next.records.some((record) => record.id === "signal-003"), false);
});

test("reset-restores-local-state", () => {
  let state = createDemoState();
  state = setQuery(setFilter(createRecord(state, { title: "Temporary" }), "closed"), "temporary");
  const reset = resetDemo();
  assert.deepEqual(reset.records, INITIAL_RECORDS);
  assert.equal(reset.filter, "all");
  assert.equal(reset.query, "");
  reset.records[0].title = "Changed copy";
  assert.equal(INITIAL_RECORDS[0].title, "Candidate ledger review");
});

test("responsive-embedded-contract", () => {
  const source = readFileSync(componentPath, "utf8");
  assert.match(source, /data-live-mockup/);
  assert.match(source, /data-preview-size="desktop"/);
  assert.match(source, /data-action="reset"/);
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /data-preview-size="mobile"\] \.demo-app__body/);
  assert.match(source, /data-preview-size="mobile"\] :global\(\.demo-record\)/);
  assert.match(source, /\.live-mockup\[data-preview-size="mobile"\].*demo-dialog__grid/);
  assert.match(source, /data-record-action/);
});

const failed = checks.filter((check) => check.status === "failed");
const status = failed.length === 0 ? "passed" : "failed";
const head = (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "uncommitted";
  }
})();
const evidence = {
  schemaVersion: "tabellio-validator-evidence/v0.1",
  validatorId: "live-mockup-tests",
  status,
  summary: status === "passed"
    ? `Live Mockup interaction tests passed at candidate ${head}.`
    : `Live Mockup interaction tests failed: ${failed.map((check) => `${check.id}: ${check.detail}`).join("; ")}`,
  metrics: [
    { name: "tests_passed", value: checks.length - failed.length, unit: "tests" },
    { name: "tests_total", value: checks.length, unit: "tests" },
  ],
  cost: { telemetry: "not_applicable", usd: null, modelCalls: null, toolCalls: null },
  artifacts: [],
};

mkdirSync(path.dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ ...evidence, checks }, null, 2));
process.exit(status === "passed" ? 0 : 1);

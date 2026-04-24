import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const pipelineScripts = [
  "extract-features.js",
  "update-personal-model.js",
  "update-sequence-model.js",
  "update-global-model.js",
  "update-bandit-state.js",
  "run-all.js",
  "evaluate-models.js"
];

for (const script of pipelineScripts) {
  test(`pipeline script parses: ${script}`, () => {
    const target = path.join(repoRoot, "scripts/pipelines", script);
    const result = spawnSync("node", ["--check", target], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
}

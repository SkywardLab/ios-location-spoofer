import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../../../.github/workflows/deploy-location-picker-worker.yml",
  import.meta.url,
);
const workflow = await readFile(workflowPath, "utf8");

test("deploy workflow runs from the standalone Cloudflare WebUI directory", () => {
  assert.match(
    workflow,
    /^\s+working-directory:\s*location-picker\/cloudflare-webui\s*$/m,
  );
  assert.match(workflow, /^\s+run:\s*npm ci\s*$/m);
});

test("deploy workflow configures the local Worker entrypoint", () => {
  assert.match(workflow, /^\s+main:\s*['"]worker\.js['"],?\s*$/m);
  assert.match(
    workflow,
    /^\s+cache-dependency-path:\s*location-picker\/cloudflare-webui\/package-lock\.json\s*$/m,
  );
});

test("deploy workflow preserves Worker identity, KV variables, and secrets", () => {
  assert.match(workflow, /^\s+name:\s*['"]ios-location-picker['"],?\s*$/m);
  assert.match(workflow, /^\s+binding:\s*['"]LOC_KV['"],?\s*$/m);
  assert.match(workflow, /vars\.CLOUDFLARE_KV_NAMESPACE_ID/);
  assert.match(workflow, /vars\.CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID/);
  assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
});

test("deploy workflow tests before local Wrangler deployment", () => {
  const testStep = workflow.indexOf("run: npm test");
  const deployStep = workflow.indexOf(
    "run: npx wrangler deploy --config wrangler.ci.jsonc",
  );

  assert.notEqual(testStep, -1);
  assert.notEqual(deployStep, -1);
  assert.ok(testStep < deployStep);
});

test("deploy workflow smoke tests after deployment", () => {
  const deployStep = workflow.indexOf(
    "run: npx wrangler deploy --config wrangler.ci.jsonc",
  );
  const smokeStep = workflow.indexOf(
    "curl --fail https://ios-location-picker.skywardlab.workers.dev/health",
  );

  assert.notEqual(deployStep, -1);
  assert.notEqual(smokeStep, -1);
  assert.ok(deployStep < smokeStep);
});

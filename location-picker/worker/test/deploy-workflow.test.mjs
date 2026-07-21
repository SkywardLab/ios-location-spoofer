import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../../../.github/workflows/deploy-location-picker-worker.yml",
  import.meta.url,
);
const workflow = await readFile(workflowPath, "utf8");

test("deploy workflow watches the Cloudflare WebUI worker", () => {
  assert.match(
    workflow,
    /^\s*-\s+["']location-picker\/cloudflare-webui\/worker\.js["']\s*$/m,
  );
});

test("deploy workflow uses the Cloudflare WebUI worker as Wrangler main", () => {
  assert.match(
    workflow,
    /^\s+main:\s*['"]\.\.\/cloudflare-webui\/worker\.js['"],?\s*$/m,
  );
});

test("deploy workflow preserves the Worker name and KV binding", () => {
  assert.match(workflow, /^\s+name:\s*['"]ios-location-picker['"],?\s*$/m);
  assert.match(workflow, /^\s+binding:\s*['"]LOC_KV['"],?\s*$/m);
});

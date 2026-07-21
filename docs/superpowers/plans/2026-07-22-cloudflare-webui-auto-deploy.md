# Cloudflare WebUI Automatic Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy `location-picker/cloudflare-webui/worker.js` to the existing `ios-location-picker` Cloudflare Worker after relevant changes reach `main`.

**Architecture:** Keep the existing GitHub Actions and Wrangler deployment pipeline. Change the generated Wrangler entry point and push path filter to select the single-file WebUI artifact, while preserving the existing Cloudflare Worker identity, KV binding, and credentials.

**Tech Stack:** GitHub Actions, Cloudflare Workers, Wrangler 4, Node.js built-in test runner

---

## File Structure

- Create `location-picker/worker/test/deploy-workflow.test.mjs`: regression checks for the workflow trigger, Wrangler entry point, Worker name, and KV binding.
- Modify `.github/workflows/deploy-location-picker-worker.yml`: deploy the WebUI single-file Worker when that artifact changes on `main`.

### Task 1: Add Workflow Regression Tests

**Files:**
- Create: `location-picker/worker/test/deploy-workflow.test.mjs`
- Test: `.github/workflows/deploy-location-picker-worker.yml`

- [ ] **Step 1: Write the failing tests**

Create `location-picker/worker/test/deploy-workflow.test.mjs`:

```js
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
    /- ["']location-picker\/cloudflare-webui\/worker\.js["']/,
  );
});

test("deploy workflow uses the Cloudflare WebUI worker as Wrangler main", () => {
  assert.match(workflow, /main: ['"]\.\.\/cloudflare-webui\/worker\.js['"]/);
});

test("deploy workflow preserves the Worker name and KV binding", () => {
  assert.match(workflow, /name: ['"]ios-location-picker['"]/);
  assert.match(workflow, /binding: ['"]LOC_KV['"]/);
});
```

- [ ] **Step 2: Run the tests and verify the new expectations fail**

Run:

```bash
node --test location-picker/worker/test/deploy-workflow.test.mjs
```

Expected: two failing tests report missing `location-picker/cloudflare-webui/worker.js` trigger and missing `../cloudflare-webui/worker.js` Wrangler entry; the Worker identity test passes.

- [ ] **Step 3: Commit the failing regression tests**

```bash
git add location-picker/worker/test/deploy-workflow.test.mjs
git commit -m "test: cover webui worker deployment workflow"
```

### Task 2: Switch Automatic Deployment to the WebUI Worker

**Files:**
- Modify: `.github/workflows/deploy-location-picker-worker.yml:7-9,48-51`
- Test: `location-picker/worker/test/deploy-workflow.test.mjs`

- [ ] **Step 1: Change the push path filter**

Replace the workflow path list with:

```yaml
    paths:
      - "location-picker/cloudflare-webui/worker.js"
      - ".github/workflows/deploy-location-picker-worker.yml"
```

- [ ] **Step 2: Change the generated Wrangler entry point**

Set the generated configuration entry to:

```js
          const config = {
            name: 'ios-location-picker',
            main: '../cloudflare-webui/worker.js',
            compatibility_date: '2026-01-01',
```

- [ ] **Step 3: Run the workflow regression tests**

Run:

```bash
node --test location-picker/worker/test/deploy-workflow.test.mjs
```

Expected: 3 tests pass and 0 tests fail.

- [ ] **Step 4: Run all Worker tests**

Run:

```bash
node --test location-picker/worker/test/*.test.mjs
```

Expected: every Worker behavior and deployment workflow test passes with 0 failures.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff --check
git diff -- .github/workflows/deploy-location-picker-worker.yml location-picker/worker/test/deploy-workflow.test.mjs
```

Expected: `git diff --check` produces no output; the diff contains only the path-filter change, Wrangler entry-point change, and regression test.

- [ ] **Step 6: Commit the deployment change**

```bash
git add .github/workflows/deploy-location-picker-worker.yml
git commit -m "ci: deploy cloudflare webui worker"
```

### Task 3: Publish Through the Protected Main Branch

**Files:**
- Verify: `.github/workflows/deploy-location-picker-worker.yml`
- Verify: `location-picker/cloudflare-webui/worker.js`

- [ ] **Step 1: Push the feature branch**

```bash
git push -u origin chore/cloudflare-webui-auto-deploy
```

Expected: GitHub creates or updates the remote feature branch.

- [ ] **Step 2: Create the pull request**

```bash
gh pr create \
  --repo SkywardLab/ios-location-spoofer \
  --base main \
  --head chore/cloudflare-webui-auto-deploy \
  --title "Deploy Cloudflare WebUI worker automatically" \
  --body "Switch the existing Wrangler workflow to deploy location-picker/cloudflare-webui/worker.js and add regression coverage for the deployment configuration."
```

Expected: GitHub returns the new pull request URL.

- [ ] **Step 3: Merge the pull request after repository checks complete**

```bash
gh pr merge --repo SkywardLab/ios-location-spoofer --merge --delete-branch
```

Expected: the pull request state becomes `MERGED`; the push to `main` starts `Deploy Location Picker Worker`.

- [ ] **Step 4: Verify the deployment workflow**

```bash
gh run list \
  --repo SkywardLab/ios-location-spoofer \
  --workflow deploy-location-picker-worker.yml \
  --limit 1
```

Expected: the newest run targets `main` and reaches `completed success`.

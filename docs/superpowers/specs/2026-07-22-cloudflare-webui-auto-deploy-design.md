# Cloudflare WebUI Automatic Deployment Design

## Goal

Deploy `location-picker/cloudflare-webui/worker.js` to the existing
`ios-location-picker` Cloudflare Worker whenever the relevant files reach
`main`.

## Architecture

The existing GitHub Actions workflow remains the deployment entry point. It
installs Wrangler, generates a temporary CI configuration, and deploys the
single-file WebUI Worker. The deployment continues to use the existing
Cloudflare account, Worker name, KV namespace, and `TOKEN` secret.

## Workflow Changes

- Trigger deployment for changes to
  `location-picker/cloudflare-webui/worker.js` and the deployment workflow.
- Set the generated Wrangler `main` entry to
  `../cloudflare-webui/worker.js`, relative to the workflow working directory
  `location-picker/worker`.
- Keep the current Worker name, compatibility date, `workers_dev` setting,
  and `LOC_KV` binding.
- Keep manual `workflow_dispatch` deployment available.

## Data and Secrets

The workflow continues to read these repository settings:

- `CLOUDFLARE_KV_NAMESPACE_ID`
- `CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare continues to provide the Worker `TOKEN` secret at runtime. Existing
KV data remains available through the unchanged `LOC_KV` binding.

## Validation

Automated tests will parse the workflow and verify:

1. The push trigger includes the WebUI Worker path.
2. The generated Wrangler entry points to the WebUI Worker file.
3. The deployment retains the existing Worker name and KV binding.

The existing Worker behavior tests will continue to validate the single-file
artifact's location controls and favorites support.

## Deployment Result

A qualifying push to `main` deploys
`location-picker/cloudflare-webui/worker.js` to the existing
`ios-location-picker` Worker through Wrangler.

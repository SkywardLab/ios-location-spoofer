import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactUrl = new URL("../../cloudflare-webui/worker.js", import.meta.url);
const artifact = await readFile(artifactUrl, "utf8");

test("Cloudflare WebUI artifact pins Leaflet assets with SRI", () => {
  assert.match(artifact, /leaflet\.css[^>]+integrity="sha384-[^"]+"[^>]+crossorigin="anonymous"/);
  assert.match(artifact, /leaflet\.js[^>]+integrity="sha384-[^"]+"[^>]+crossorigin="anonymous"/);
});

test("Cloudflare WebUI artifact protects the token page with security headers", async () => {
  const { default: worker } = await import(artifactUrl);
  const response = await worker.fetch(new Request("https://example.com/?token=secret"), {
    TOKEN: "secret",
    LOC_KV: { get: async () => null, put: async () => {} },
  });

  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");

  const csp = response.headers.get("Content-Security-Policy");
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src https:\/\/unpkg\.com 'unsafe-inline'/);
  assert.match(csp, /connect-src 'self' https:\/\/api\.open-meteo\.com https:\/\/nominatim\.openstreetmap\.org/);
  assert.match(csp, /frame-ancestors 'none'/);
});

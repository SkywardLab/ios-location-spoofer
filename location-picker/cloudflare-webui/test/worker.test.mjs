import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("worker.js", new URL("..", import.meta.url));
const { default: worker } = await import(workerUrl);
const source = await readFile(workerUrl, "utf8");

test("standalone Worker source declares local ownership", () => {
  assert.match(source, /^\/\/ Independently maintained Cloudflare WebUI Worker\.$/m);
});

test("standalone Worker pins complete Leaflet SRI metadata", () => {
  assert.match(
    source,
    /leaflet\.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous"/,
  );
  assert.match(
    source,
    /leaflet\.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS\+qpjv2JkIHNVcuOrM\+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous"/,
  );
});

test("standalone Worker exposes its health endpoint", async () => {
  const response = await worker.fetch(new Request("https://example.com/health"), {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    kv: false,
    tokenConfigured: false,
  });
});

test("standalone Worker protects the token page with security headers", async () => {
  const response = await worker.fetch(new Request("https://example.com/?token=secret"), {
    TOKEN: "secret",
    LOC_KV: { get: async () => null, put: async () => {} },
  });

  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const csp = response.headers.get("Content-Security-Policy");
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src https:\/\/unpkg\.com 'unsafe-inline'/);
  assert.match(
    csp,
    /connect-src 'self' https:\/\/api\.open-meteo\.com https:\/\/nominatim\.openstreetmap\.org/,
  );
  assert.match(csp, /frame-ancestors 'none'/);
});

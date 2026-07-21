import assert from "node:assert/strict";
import test from "node:test";

import worker from "../worker.js";

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
  assert.match(response.headers.get("Content-Security-Policy"), /default-src 'none'/);
});

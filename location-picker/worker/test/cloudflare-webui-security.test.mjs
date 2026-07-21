import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactUrl = new URL("../../cloudflare-webui/worker.js", import.meta.url);
const pageUrl = new URL("../src/page.js", import.meta.url);
const indexUrl = new URL("../src/index.js", import.meta.url);
const artifact = await readFile(artifactUrl, "utf8");

test("Cloudflare WebUI artifact pins Leaflet assets with SRI", () => {
  assert.match(artifact, /leaflet\.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous"/);
  assert.match(artifact, /leaflet\.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS\+qpjv2JkIHNVcuOrM\+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous"/);
});

test("Cloudflare WebUI artifact matches the Worker sources", async () => {
  const page = await readFile(pageUrl, "utf8");
  const index = await readFile(indexUrl, "utf8");
  const header = [
    "// 与 location-picker/server.js 的 PAGE 保持一致（地图选点 UI）",
    "// ⚠️ 本文件由 worker/src/page.js + worker/src/index.js 合并生成，请勿手改；",
    "//    要改逻辑请改 worker/src/ 再重新合并，避免多份副本漂移。",
    "",
  ].join("\n");
  const inlinedPage = page.slice(page.indexOf("\n") + 1);
  const inlinedIndex = index.replace('import { PAGE } from "./page.js";\n\n', "");

  assert.equal(artifact, `${header}\n${inlinedPage}\n${inlinedIndex}`);
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

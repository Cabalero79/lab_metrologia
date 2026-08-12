import assert from "node:assert/strict";
import test from "node:test";

import { renderWorker } from "./helpers/render-worker.mjs";

function directives(value) {
  return new Map(
    value
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [name, ...sources] = entry.split(/\s+/);
        return [name, sources];
      }),
  );
}

test("worker aplica o conjunto mínimo de cabeçalhos defensivos", async () => {
  const response = await renderWorker();

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(response.headers.get("permissions-policy") ?? "", /microphone=\(\)/);
  assert.match(response.headers.get("permissions-policy") ?? "", /geolocation=\(\)/);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("server"), null);
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("CSP restringe scripts, enquadramento, objetos, formulários e rede", async () => {
  const response = await renderWorker();
  const csp = response.headers.get("content-security-policy");
  assert.ok(csp, "Content-Security-Policy ausente");

  const policy = directives(csp);
  assert.deepEqual(policy.get("default-src"), ["'self'"]);
  assert.deepEqual(policy.get("base-uri"), ["'self'"]);
  assert.deepEqual(policy.get("object-src"), ["'none'"]);
  assert.deepEqual(policy.get("frame-ancestors"), ["'self'"]);
  assert.deepEqual(policy.get("form-action"), ["'self'"]);
  assert.deepEqual(policy.get("connect-src"), ["'self'"]);
  const scriptSources = policy.get("script-src") ?? [];
  assert.ok(scriptSources.includes("'self'"));
  assert.ok(!scriptSources.includes("'unsafe-eval'"));
  assert.ok(!scriptSources.some((source) => /^(?:https?:|data:|\*)/i.test(source)));
  assert.ok(!csp.includes("*"), "CSP não deve conter curingas");
});

test("cabeçalhos também protegem respostas 404", async () => {
  const response = await renderWorker("/rota-inexistente");

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(response.headers.get("content-security-policy"));
});

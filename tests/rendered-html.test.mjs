import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderWorker } from "./helpers/render-worker.mjs";

test("renderiza o laboratório de metrologia em português", async () => {
  const response = await renderWorker();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /lang="pt-BR"/);
  assert.match(html, /Paquímetro Universal Virtual/);
  assert.match(html, /Cabalero_Automações/);
  assert.match(html, /Engenharia de Software aplicada à Indústria/);
  assert.match(html, /Laboratório de metrologia/);
  assert.match(html, /role="slider"/);
  assert.match(html, /Ocultar medida/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Building your site/i);
});

test("entrega metadados sociais e controles acessíveis no HTML inicial", async () => {
  const response = await renderWorker();
  const html = await response.text();

  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /<canvas[^>]+role="slider"[^>]+tabindex="0"/s);
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="150"/);
  assert.match(html, /aria-valuetext="58,35 mm"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-label="Ocultar medida"/);
  assert.match(html, /aria-label="Ampliar escala e nônio"/);
  assert.match(html, /aria-controls="caliper-canvas"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="caliper-canvas"/);

  const headings = html.match(/<h1\b/g) ?? [];
  assert.equal(headings.length, 1, "a página deve ter exatamente um título principal");
});

test("não incorpora navegação, downloads ou conteúdo ativo de terceiros", async () => {
  const response = await renderWorker();
  const html = await response.text();

  assert.doesNotMatch(html, /<(?:iframe|object|embed)\b/i);
  assert.doesNotMatch(html, /\bdownload(?:=|\s|>)/i);
  assert.doesNotMatch(html, /\b(?:src|href)=["']https?:\/\/(?!laboratorio\.test)/i);
  assert.doesNotMatch(html, /javascript:|data:text\/html/i);
});

test("mantém a implementação livre de conteúdo executável e HTML inseguro", async () => {
  const [component, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/components/CaliperWorkbench.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  const source = `${component}\n${page}\n${layout}`;
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(|javascript:|\.exe\b/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(component, /onPointerDown/);
  assert.match(component, /onKeyDown/);
  assert.match(component, /requestFullscreen/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /aria-label=\{detailMode \? "Fechar ampliação"/);
  assert.match(component, /event\.key !== "Escape"/);
  assert.match(component, /getDetailViewport/);
});

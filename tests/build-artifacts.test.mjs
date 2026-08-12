import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectFile = (relativePath) => new URL(`../${relativePath}`, import.meta.url);

test("build produz worker, manifesto e ativos locais essenciais", async () => {
  const requiredFiles = [
    "dist/server/index.js",
    "dist/server/wrangler.json",
    "dist/client/.vite/manifest.json",
    "dist/client/favicon.svg",
  ];

  await Promise.all(requiredFiles.map((file) => access(projectFile(file))));
  for (const file of requiredFiles) {
    const metadata = await stat(projectFile(file));
    assert.ok(metadata.size > 0, `${file} não pode estar vazio`);
  }
});

test("artefato publicado não contém arquivos executáveis legados", async () => {
  const manifest = await readFile(projectFile("dist/client/.vite/manifest.json"), "utf8");
  assert.doesNotMatch(manifest, /\.(?:exe|msi|bat|cmd|com)(?:["?#]|$)/i);
  assert.doesNotMatch(manifest, /stefanelli\.eng\.br/i);
});

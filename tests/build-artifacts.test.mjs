import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectFile = (relativePath) => new URL(`../${relativePath}`, import.meta.url);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      return entry.isDirectory() ? listFiles(child) : [child];
    }),
  );
  return nested.flat();
}

test("build produz worker, manifesto e ativos locais essenciais", async () => {
  const requiredFiles = [
    "dist/server/index.js",
    "dist/server/wrangler.json",
    "dist/client/.vite/manifest.json",
    "dist/client/favicon.svg",
    "dist/client/cavaleiro-samurai.png",
  ];

  await Promise.all(requiredFiles.map((file) => access(projectFile(file))));
  for (const file of requiredFiles) {
    const metadata = await stat(projectFile(file));
    assert.ok(metadata.size > 0, `${file} não pode estar vazio`);
  }
});

test("artefato mantém observabilidade persistente desativada", async () => {
  const wranglerConfig = JSON.parse(
    await readFile(projectFile("dist/server/wrangler.json"), "utf8"),
  );

  assert.equal(wranglerConfig.observability?.enabled, false);
});

test("artefato publicado não contém arquivos executáveis legados", async () => {
  const manifest = await readFile(projectFile("dist/client/.vite/manifest.json"), "utf8");
  assert.doesNotMatch(manifest, /\.(?:exe|msi|bat|cmd|com)(?:["?#]|$)/i);
  assert.doesNotMatch(manifest, /stefanelli\.eng\.br/i);

  const files = await listFiles(projectFile("dist/"));
  for (const file of files) {
    assert.doesNotMatch(
      file.pathname,
      /\.(?:exe|msi|bat|cmd|com|swf|fla|as|jar|zip)$/i,
      `artefato legado proibido: ${file.pathname}`,
    );
  }
});

test("artefato não publica ícones padrão sem uso", async () => {
  const forbiddenUnusedAssets = new Set(["file.svg", "globe.svg", "window.svg"]);
  const files = await listFiles(projectFile("dist/client/"));

  for (const file of files) {
    const filename = decodeURIComponent(file.pathname.split("/").at(-1) ?? "");
    assert.ok(
      !forbiddenUnusedAssets.has(filename),
      `ativo padrão sem uso publicado: ${filename}`,
    );
  }
});

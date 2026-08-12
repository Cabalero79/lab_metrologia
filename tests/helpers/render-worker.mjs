let workerPromise;

async function loadWorker() {
  workerPromise ??= import(
    new URL(`../../dist/server/index.js?test-worker=${process.pid}`, import.meta.url)
      .href
  );

  const workerBundle = await workerPromise;
  return workerBundle.default;
}

/**
 * Exercise the exact Cloudflare Worker artifact produced by `vinext build`.
 * No network access is available through these bindings: an accidental asset
 * request fails locally and image optimization cannot call an external origin.
 */
export async function renderWorker(pathname = "/", init = {}) {
  const worker = await loadWorker();
  const request = new Request(new URL(pathname, "https://laboratorio.test"), {
    headers: { accept: "text/html", ...init.headers },
    ...init,
  });

  return worker.fetch(
    request,
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      IMAGES: {
        input() {
          throw new Error("image optimization is outside the SSR smoke test");
        },
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

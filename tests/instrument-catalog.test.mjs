import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENT_OPTIONS } from "../app/components/instrument-types.ts";

test("catálogo central oferece os quatro instrumentos sem IDs duplicados", () => {
  assert.deepEqual(
    INSTRUMENT_OPTIONS.map((option) => option.id),
    [
      "caliper",
      "internal-micrometer",
      "external-micrometer",
      "semicircular-protractor",
    ],
  );
  assert.equal(new Set(INSTRUMENT_OPTIONS.map((option) => option.id)).size, 4);
  assert.equal(new Set(INSTRUMENT_OPTIONS.map((option) => option.label)).size, 4);
});

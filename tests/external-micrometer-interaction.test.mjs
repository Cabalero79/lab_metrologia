import assert from "node:assert/strict";
import test from "node:test";

import {
  EXTERNAL_MICROMETER_MAX_TICKS,
  EXTERNAL_MICROMETER_MIN_TICKS,
} from "../lib/external-micrometer.ts";
import {
  getExternalMicrometerDragTicks,
} from "../lib/external-micrometer-interaction.ts";

test("arraste milesimal alcança cada milésimo sem saltar valores", () => {
  const originTicks = 10_000;
  assert.equal(getExternalMicrometerDragTicks(originTicks, 1, 1), 10_001);
  assert.equal(getExternalMicrometerDragTicks(originTicks, -1, 1), 9_999);

  for (
    let targetTicks = EXTERNAL_MICROMETER_MIN_TICKS;
    targetTicks <= EXTERNAL_MICROMETER_MAX_TICKS;
    targetTicks += 1
  ) {
    assert.equal(
      getExternalMicrometerDragTicks(
        originTicks,
        targetTicks - originTicks,
        1,
      ),
      targetTicks,
    );
  }
});

test("arraste centesimal alcança cada centésimo sem saltar valores", () => {
  const originTicks = 10_000;
  for (
    let targetTicks = EXTERNAL_MICROMETER_MIN_TICKS;
    targetTicks <= EXTERNAL_MICROMETER_MAX_TICKS;
    targetTicks += 10
  ) {
    assert.equal(
      getExternalMicrometerDragTicks(
        originTicks,
        (targetTicks - originTicks) / 10,
        10,
        "external-mm-0.01",
      ),
      targetTicks,
    );
  }
});

test("ganho selecionado preserva direção, limites e valida parâmetros", () => {
  assert.equal(getExternalMicrometerDragTicks(10_000, 5, 100), 10_500);
  assert.equal(getExternalMicrometerDragTicks(10_000, -5, 100), 9_500);
  assert.equal(getExternalMicrometerDragTicks(10_000, 10_000, 100), 25_000);
  assert.equal(getExternalMicrometerDragTicks(10_000, -10_000, 100), 0);
  assert.throws(
    () => getExternalMicrometerDragTicks(10_000, Number.NaN, 1),
    RangeError,
  );
  assert.throws(
    () => getExternalMicrometerDragTicks(10_000, 1, 0),
    RangeError,
  );
});

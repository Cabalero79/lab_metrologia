import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
} from "../lib/internal-micrometer.ts";
import {
  INTERNAL_MICROMETER_DRAG_PIXELS_PER_STEP,
  getInternalMicrometerDragTicks,
} from "../lib/internal-micrometer-interaction.ts";

test("arraste alcança cada centésimo sem saltar valores", () => {
  assert.equal(INTERNAL_MICROMETER_DRAG_PIXELS_PER_STEP, 1);

  const originTicks = 736;
  assert.equal(getInternalMicrometerDragTicks(originTicks, 185), 551);
  assert.equal(getInternalMicrometerDragTicks(originTicks, 186), 550);
  assert.equal(getInternalMicrometerDragTicks(originTicks, 187), 549);

  for (
    let targetTicks = INTERNAL_MICROMETER_MIN_TICKS;
    targetTicks <= INTERNAL_MICROMETER_MAX_TICKS;
    targetTicks += 1
  ) {
    const deltaCssPixels = originTicks - targetTicks;
    assert.equal(
      getInternalMicrometerDragTicks(originTicks, deltaCssPixels),
      targetTicks,
    );
  }
});

test("arraste preserva direção, limites e rejeita deslocamento inválido", () => {
  assert.equal(getInternalMicrometerDragTicks(736, -1), 737);
  assert.equal(getInternalMicrometerDragTicks(736, 1), 735);
  assert.equal(getInternalMicrometerDragTicks(736, -10_000), 1_500);
  assert.equal(getInternalMicrometerDragTicks(736, 10_000), 500);
  assert.throws(
    () => getInternalMicrometerDragTicks(736, Number.NaN),
    RangeError,
  );
});

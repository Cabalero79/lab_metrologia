import assert from "node:assert/strict";
import test from "node:test";

import {
  getPointerAngleDegrees,
  getShortestAngularDeltaDegrees,
  getVernierGoniometerDragTicks,
  isPointerOutsidePivotDeadZone,
} from "../lib/vernier-goniometer-interaction.ts";

test("ângulo do ponteiro acompanha o sistema horário do canvas", () => {
  assert.equal(getPointerAngleDegrees(20, 10, 10, 10), 0);
  assert.equal(getPointerAngleDegrees(10, 20, 10, 10), 90);
  assert.equal(getPointerAngleDegrees(0, 10, 10, 10), 180);
  assert.equal(getPointerAngleDegrees(10, 0, 10, 10), 270);
});

test("menor delta atravessa 359° e 0° nos dois sentidos", () => {
  assert.equal(getShortestAngularDeltaDegrees(359, 1), 2);
  assert.equal(getShortestAngularDeltaDegrees(1, 359), -2);
  assert.equal(getVernierGoniometerDragTicks(21_540, 359, 1), 60);
  assert.equal(getVernierGoniometerDragTicks(60, 1, 359), 21_540);
});

test("arraste quantiza no passo de cinco minutos", () => {
  assert.equal(getVernierGoniometerDragTicks(0, 0, 10), 600);
  assert.equal(getVernierGoniometerDragTicks(0, 0, 0.04), 0);
  assert.equal(getVernierGoniometerDragTicks(0, 0, 0.05), 5);
});

test("região morta do pivô evita orientação instável", () => {
  assert.equal(isPointerOutsidePivotDeadZone(10, 10, 10, 10, 20), false);
  assert.equal(isPointerOutsidePivotDeadZone(30, 10, 10, 10, 20), true);
  assert.throws(() => isPointerOutsidePivotDeadZone(0, 0, 0, 0, -1), RangeError);
});

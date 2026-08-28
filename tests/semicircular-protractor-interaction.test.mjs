import assert from "node:assert/strict";
import test from "node:test";

import {
  getSemicircularProtractorArcMinutesFromPointer,
  getSemicircularProtractorDetailDragArcMinutes,
  isPointerOutsideProtractorDeadZone,
} from "../lib/semicircular-protractor-interaction.ts";

test("ponteiro lê diretamente o arco superior em minutos exatos", () => {
  assert.equal(getSemicircularProtractorArcMinutesFromPointer(0, 100, 100, 100), 300);
  assert.equal(getSemicircularProtractorArcMinutesFromPointer(100, 0, 100, 100), 5_400);
  assert.equal(getSemicircularProtractorArcMinutesFromPointer(200, 100, 100, 100), 10_800);
  assert.equal(getSemicircularProtractorArcMinutesFromPointer(0, 120, 100, 100), 300);
  assert.equal(getSemicircularProtractorArcMinutesFromPointer(200, 120, 100, 100), 10_800);
});

test("arraste na lupa move a escala cinco minutos por passo visual", () => {
  assert.equal(getSemicircularProtractorDetailDragArcMinutes(1_825, -8, 8), 1_830);
  assert.equal(getSemicircularProtractorDetailDragArcMinutes(1_825, 8, 8), 1_820);
  assert.equal(getSemicircularProtractorDetailDragArcMinutes(300, 800, 8), 300);
  assert.equal(getSemicircularProtractorDetailDragArcMinutes(10_800, -800, 8), 10_800);
});

test("região morta evita giro instável junto ao pivô", () => {
  assert.equal(isPointerOutsideProtractorDeadZone(10, 10, 10, 10, 20), false);
  assert.equal(isPointerOutsideProtractorDeadZone(30, 10, 10, 10, 20), true);
  assert.throws(
    () => isPointerOutsideProtractorDeadZone(0, 0, 0, 0, -1),
    RangeError,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  VERNIER_GONIOMETER_GEOMETRY_RATIOS,
  getGoniometerMainScaleMarkAngleDegrees,
  getGoniometerVernierMarkAngleDegrees,
  getVernierGoniometerGeometry,
} from "../lib/vernier-goniometer-geometry.ts";

const VIEWPORTS = [
  { name: "desktop", width: 1_211, height: 455 },
  { name: "projetor", width: 1_024, height: 430 },
  { name: "celular horizontal", width: 844, height: 390 },
  { name: "mínimo", width: 320, height: 380 },
];
const READINGS = [0, 5, 925, 2_540, 4_305, 5_400, 10_795, 21_595];
const EPSILON = 1e-8;

test("topologia física permanece dentro da cena responsiva", () => {
  for (const viewport of VIEWPORTS) {
    for (const ticks of READINGS) {
      const layout = getVernierGoniometerGeometry(viewport.width, viewport.height, ticks);
      const label = `${viewport.name}/${ticks}`;
      assert.ok(layout.pivotX >= 0 && layout.pivotX <= viewport.width, label);
      assert.ok(layout.pivotY >= 0 && layout.pivotY <= viewport.height, label);
      assert.ok(layout.baseStartX < layout.baseEndX, `${label}: base`);
      assert.ok(layout.stockTop < layout.stockBottom, `${label}: estoque`);
      assert.ok(layout.headRadius > layout.dialRadius, `${label}: cabeça e disco distintos`);
      assert.ok(layout.hitRadius * 2 >= 44, `${label}: alvo de toque`);
      assert.ok(layout.bladeLength > layout.headRadius * 4, `${label}: lâmina dominante`);
    }
  }
});

test("pivô e base ficam fixos enquanto lâmina gira rigidamente", () => {
  for (const viewport of VIEWPORTS) {
    const zero = getVernierGoniometerGeometry(viewport.width, viewport.height, 0);
    for (const ticks of READINGS.slice(1)) {
      const layout = getVernierGoniometerGeometry(viewport.width, viewport.height, ticks);
      assert.equal(layout.pivotX, zero.pivotX);
      assert.equal(layout.pivotY, zero.pivotY);
      assert.equal(layout.baseStartX, zero.baseStartX);
      assert.equal(layout.stockRight, zero.stockRight);
      const length = Math.hypot(
        layout.bladeEndX - layout.bladeStartX,
        layout.bladeEndY - layout.bladeStartY,
      );
      assert.ok(Math.abs(length - layout.bladeLength) < EPSILON);
    }
  }
});

test("nônio físico usa doze espaços em vinte e três graus", () => {
  const left = getGoniometerVernierMarkAngleDegrees(0, 12, -1);
  const zero = getGoniometerVernierMarkAngleDegrees(0, 0, 1);
  const right = getGoniometerVernierMarkAngleDegrees(0, 12, 1);
  assert.equal(zero - left, 23);
  assert.equal(right - zero, 23);
  assert.equal(
    VERNIER_GONIOMETER_GEOMETRY_RATIOS.mainScaleZeroAngleDegrees,
    zero,
  );
});

test("marca coincidente deriva da mesma leitura inteira", () => {
  const ticks = 925;
  const layout = getVernierGoniometerGeometry(1_211, 455, ticks);
  assert.equal(layout.matchingVernierDivision, 5);
  const vernierAngle = getGoniometerVernierMarkAngleDegrees(ticks, 5, -1);
  const mainScaleAngle = getGoniometerMainScaleMarkAngleDegrees(25);
  assert.ok(Math.abs(vernierAngle - mainScaleAngle) < EPSILON);
});

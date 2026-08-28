import assert from "node:assert/strict";
import test from "node:test";

import {
  getProtractorDetailPresentation,
  getProtractorScalePoint,
  getSemicircularProtractorGeometry,
} from "../lib/semicircular-protractor-geometry.ts";

const VIEWPORTS = [
  { name: "desktop", width: 1_211, height: 455 },
  { name: "celular horizontal", width: 844, height: 390 },
  { name: "mínimo", width: 320, height: 380 },
];

test("semicírculo, base, pivô e lâmina permanecem dentro da cena", () => {
  for (const viewport of VIEWPORTS) {
    for (const arcMinutes of [300, 1_825, 5_400, 9_025, 10_800]) {
      const layout = getSemicircularProtractorGeometry(
        viewport.width,
        viewport.height,
        arcMinutes,
      );
      const label = `${viewport.name}/${arcMinutes}`;
      assert.ok(layout.baseStartX >= 0, label);
      assert.ok(layout.baseEndX <= viewport.width, label);
      assert.ok(layout.pivotY - layout.outerRadius >= 0, label);
      assert.ok(layout.bladeTailY <= viewport.height, label);
      assert.ok(layout.hitRadius * 2 >= 44, `${label}: alvo de toque`);
      assert.ok(layout.hubRadius <= 5.5, `${label}: pino visual mínimo`);
      assert.ok(
        layout.hubRadius / layout.outerRadius < 0.04,
        `${label}: pino não encobre a formação do ângulo`,
      );
    }
  }
});

test("a escala vai de zero à esquerda a 180 à direita", () => {
  const layout = getSemicircularProtractorGeometry(1_211, 455, 1_825);
  const zero = getProtractorScalePoint(layout, 0);
  const ninety = getProtractorScalePoint(layout, 90);
  const oneEighty = getProtractorScalePoint(layout, 180);
  assert.ok(Math.abs(zero.x - layout.baseStartX) < 1e-9);
  assert.ok(Math.abs(zero.y - layout.pivotY) < 1e-9);
  assert.ok(Math.abs(ninety.x - layout.pivotX) < 1e-9);
  assert.ok(Math.abs(ninety.y - (layout.pivotY - layout.outerRadius)) < 1e-9);
  assert.ok(Math.abs(oneEighty.x - layout.baseEndX) < 1e-9);
});

test("a leitura começa em 5 e preserva 90 no topo e 180 no fim", () => {
  const minimum = getSemicircularProtractorGeometry(1_211, 455, 300);
  const middle = getSemicircularProtractorGeometry(1_211, 455, 5_400);
  const maximum = getSemicircularProtractorGeometry(1_211, 455, 10_800);
  assert.equal(minimum.angleDegrees, 5);
  assert.equal(middle.angleDegrees, 90);
  assert.equal(maximum.angleDegrees, 180);
  assert.ok(minimum.bladePointerY < minimum.pivotY);
  assert.ok(Math.abs(maximum.bladePointerY - maximum.pivotY) < 1e-9);
});

test("lupa oferece passo legível de cinco minutos e mantém a leitura no centro", () => {
  for (const viewport of VIEWPORTS) {
    const detail = getProtractorDetailPresentation(
      viewport.width,
      viewport.height,
      37 * 60 + 25,
    );
    assert.ok(detail.minuteStepPitch >= 7, viewport.name);
    assert.ok(detail.minuteStepPitch * 12 >= 84, viewport.name);
    assert.equal(detail.arcMinutes, 37 * 60 + 25);
    assert.ok(detail.visibleStepRadius >= 14, viewport.name);
    assert.ok(detail.centerX > detail.left && detail.centerX < detail.right);
  }
});

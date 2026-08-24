import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
} from "../lib/internal-micrometer.ts";
import {
  INTERNAL_MICROMETER_GEOMETRY_RATIOS,
  getInternalMicrometerGeometry,
} from "../lib/internal-micrometer-geometry.ts";

const EPSILON = 1e-9;
const VIEWPORTS = [
  { name: "desktop", width: 1_211, height: 455 },
  { name: "projetor", width: 1_024, height: 430 },
  { name: "celular horizontal", width: 827, height: 380 },
  { name: "mínimo", width: 320, height: 380 },
];
const READINGS = [500, 501, 549, 550, 736, 786, 1_499, 1_500];

function close(actual, expected, message, tolerance = EPSILON) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: esperado ${expected}, recebido ${actual}`,
  );
}

test("cena usa escala uniforme e permanece integral em toda a matriz", () => {
  for (const viewport of VIEWPORTS) {
    for (const ticks of READINGS) {
      const layout = getInternalMicrometerGeometry(
        viewport.width,
        viewport.height,
        ticks,
      );
      const label = `${viewport.name}/${ticks}`;
      const expectedB = Math.max(
        1,
        Math.min(
          viewport.width / INTERNAL_MICROMETER_GEOMETRY_RATIOS.sceneWidth,
          viewport.height / INTERNAL_MICROMETER_GEOMETRY_RATIOS.sceneHeight,
        ),
      );
      close(layout.B, expectedB, `${label}: escala uniforme`);
      assert.ok(layout.originX >= -EPSILON, `${label}: origem horizontal`);
      assert.ok(layout.originY >= -EPSILON, `${label}: origem vertical`);
      assert.ok(layout.sceneRight <= viewport.width + EPSILON, `${label}: cena direita`);
      assert.ok(layout.sceneBottom <= viewport.height + EPSILON, `${label}: cena inferior`);
      assert.ok(layout.jawTipTop < layout.jawTipBottom, `${label}: ponta positiva`);
      assert.ok(layout.jawTipBottom < layout.jawShoulderY, `${label}: ponta acima do ombro`);
      assert.ok(layout.jawShoulderY < layout.jawBaseTop, `${label}: ombro acima da base`);
      assert.ok(layout.jawBaseTop < layout.jawBaseBottom, `${label}: base positiva`);
      assert.ok(layout.movingJawX < layout.fixedJawX, `${label}: duas pontas separadas`);
      assert.ok(layout.leftContactX < layout.rightContactX, `${label}: vão interno positivo`);
      close(
        layout.movingInnerFaceX,
        layout.movingPinCenterX + layout.jawTipWidth / 2,
        `${label}: haste móvel encontra a face interna em paralelo`,
      );
      close(
        layout.fixedInnerFaceX,
        layout.fixedPinCenterX - layout.jawTipWidth / 2,
        `${label}: haste fixa encontra a face interna em paralelo`,
      );
      assert.ok(
        layout.movingInnerFaceX < layout.fixedInnerFaceX,
        `${label}: folga paralela positiva`,
      );
      assert.ok(layout.sleeveStartX < layout.sleeveEndX, `${label}: bainha positiva`);
      assert.ok(layout.thimbleLeft < layout.thimbleRight, `${label}: tambor positivo`);
      assert.ok(layout.thimbleRight <= layout.ratchetLeft + EPSILON, `${label}: catraca após tambor`);
      assert.ok(layout.ratchetRight <= layout.sceneRight + EPSILON, `${label}: conjunto dentro da cena`);
      assert.ok(layout.hitRight - layout.hitLeft >= 44, `${label}: alvo horizontal`);
      assert.ok(layout.hitBottom - layout.hitTop >= 44, `${label}: alvo vertical`);
    }
  }
});

test("aumento da leitura separa as duas pontas e move o tambor à esquerda", () => {
  for (const viewport of VIEWPORTS) {
    const minimum = getInternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      INTERNAL_MICROMETER_MIN_TICKS,
    );
    let previous = minimum;
    for (const ticks of READINGS.slice(1)) {
      const current = getInternalMicrometerGeometry(
        viewport.width,
        viewport.height,
        ticks,
      );
      assert.ok(current.contactSpanPx >= previous.contactSpanPx);
      assert.ok(current.movingJawX <= previous.movingJawX);
      close(current.fixedJawX, previous.fixedJawX, `${viewport.name}: ponta fixa`);
      assert.ok(current.thimbleLeft <= previous.thimbleLeft);
      previous = current;
    }
    const maximum = getInternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      INTERNAL_MICROMETER_MAX_TICKS,
    );
    close(
      minimum.thimbleLeft - maximum.thimbleLeft,
      INTERNAL_MICROMETER_GEOMETRY_RATIOS.sleeveTravel * minimum.B,
      `${viewport.name}: curso axial`,
    );
    close(
      maximum.contactSpanPx - minimum.contactSpanPx,
      ((INTERNAL_MICROMETER_MAX_TICKS - INTERNAL_MICROMETER_MIN_TICKS) /
        INTERNAL_MICROMETER_TICKS_PER_MM) *
        INTERNAL_MICROMETER_GEOMETRY_RATIOS.contactPixelsPerMm *
        minimum.B,
      `${viewport.name}: abertura entre as duas pontas`,
    );
  }
});

test("escala principal encontra a borda do tambor nos limites de 5 e 15 mm", () => {
  for (const viewport of VIEWPORTS) {
    const minimum = getInternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      INTERNAL_MICROMETER_MIN_TICKS,
    );
    const maximum = getInternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      INTERNAL_MICROMETER_MAX_TICKS,
    );

    close(
      minimum.scaleMinimumX,
      minimum.sleeveEndX,
      `${viewport.name}: marca de 5 mm na borda`,
    );
    close(
      maximum.scaleMaximumX,
      maximum.sleeveEndX,
      `${viewport.name}: marca de 15 mm na borda`,
    );
    close(
      minimum.scaleMaximumX,
      maximum.scaleMaximumX,
      `${viewport.name}: escala absoluta permanece fixa`,
    );
    assert.ok(
      minimum.scaleMaximumX - minimum.sleeveStartX <= minimum.B * 0.16,
      `${viewport.name}: números começam junto ao início da bainha`,
    );
  }
});

test("diâmetro das pontas e abertura nominal compartilham a mesma escala física", () => {
  const layout = getInternalMicrometerGeometry(
    VIEWPORTS[0].width,
    VIEWPORTS[0].height,
    INTERNAL_MICROMETER_MIN_TICKS,
  );
  close(
    layout.jawTipWidth,
    2 * INTERNAL_MICROMETER_GEOMETRY_RATIOS.contactPixelsPerMm * layout.B,
    "ponta de 2 mm",
  );
  close(
    layout.contactSpanPx,
    5 * INTERNAL_MICROMETER_GEOMETRY_RATIOS.contactPixelsPerMm * layout.B,
    "abertura mínima de 5 mm",
  );
  close(
    layout.fixedInnerFaceX - layout.movingInnerFaceX,
    (5 - 2 * 2) * INTERNAL_MICROMETER_GEOMETRY_RATIOS.contactPixelsPerMm * layout.B,
    "folga de 1 mm entre duas pontas de 2 mm",
  );
});

test("fase do tambor dá a volta exata nos limites de meia marca", () => {
  const viewport = VIEWPORTS[0];
  const beforeWrap = getInternalMicrometerGeometry(
    viewport.width,
    viewport.height,
    549,
  );
  const afterWrap = getInternalMicrometerGeometry(
    viewport.width,
    viewport.height,
    550,
  );
  assert.equal(beforeWrap.thimbleDivision, 49);
  close(beforeWrap.thimbleAngleDegrees, 352.8, "ângulo antes do wrap");
  assert.equal(afterWrap.thimbleDivision, 0);
  close(afterWrap.thimbleAngleDegrees, 0, "ângulo após o wrap");
});

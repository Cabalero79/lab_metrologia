import assert from "node:assert/strict";
import test from "node:test";

import {
  EXTERNAL_MICROMETER_MAX_TICKS,
  EXTERNAL_MICROMETER_TICKS_PER_MM,
} from "../lib/external-micrometer.ts";
import {
  EXTERNAL_MICROMETER_GEOMETRY_RATIOS,
  EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS,
  getExternalMicrometerGeometry,
  getExternalMicrometerScaleMarkX,
  getExternalMicrometerVernierPresentation,
  isExternalMicrometerScaleMarkExposed,
} from "../lib/external-micrometer-geometry.ts";

const EPSILON = 1e-9;
const VIEWPORTS = [
  { name: "desktop", width: 1_211, height: 455 },
  { name: "projetor", width: 1_024, height: 430 },
  { name: "celular horizontal", width: 844, height: 390 },
  { name: "mínimo", width: 320, height: 380 },
];
const READINGS = [0, 1, 499, 500, 5_000, 12_507, 24_999, 25_000];

function close(actual, expected, message, tolerance = EPSILON) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: esperado ${expected}, recebido ${actual}`,
  );
}

test("ferradura quadrada preserva componentes e letreiro sem sobreposicao", () => {
  const frame = EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS;
  assert.equal(frame.outerLeft, EXTERNAL_MICROMETER_GEOMETRY_RATIOS.frameLeft);
  assert.equal(frame.outerRight, EXTERNAL_MICROMETER_GEOMETRY_RATIOS.frameRight);
  assert.equal(
    frame.outerLeft,
    0.66,
    "lado externo esquerdo acompanha o inicio do batente",
  );
  assert.equal(
    frame.innerLeft,
    EXTERNAL_MICROMETER_GEOMETRY_RATIOS.anvilFaceX,
    "lado interno esquerdo acompanha a face do batente",
  );
  assert.equal(
    frame.innerRight,
    EXTERNAL_MICROMETER_GEOMETRY_RATIOS.bossLeft,
    "lado interno direito acompanha o inicio da caixa da trava",
  );
  assert.equal(
    frame.outerRight,
    EXTERNAL_MICROMETER_GEOMETRY_RATIOS.bossRight,
    "lado externo direito acompanha o fim da caixa da trava",
  );
  close(
    frame.outerBottomFromAxis,
    EXTERNAL_MICROMETER_GEOMETRY_RATIOS.frameBottom -
      EXTERNAL_MICROMETER_GEOMETRY_RATIOS.axisY,
    "base quadrada encontra o envelope da cena",
  );
  assert.ok(frame.leftTopFromAxis >= 0.24, "quadro termina sob o batente esquerdo");
  assert.equal(frame.rightTopFromAxis, 0.7, "quadro encontra a base da caixa da trava");
  assert.ok(frame.innerLeft > frame.outerLeft);
  assert.ok(frame.innerRight < frame.outerRight);
  assert.ok(frame.innerBottomFromAxis < frame.outerBottomFromAxis);
  assert.ok(frame.grooveLeftTopFromAxis > frame.leftTopFromAxis);
  assert.ok(frame.grooveRightTopFromAxis > frame.rightTopFromAxis);
  assert.ok(frame.nameplateTopFromAxis >= frame.innerBottomFromAxis);
  assert.ok(
    frame.nameplateTopFromAxis + frame.nameplateHeight <=
      frame.outerBottomFromAxis,
  );
  assert.ok(frame.nameplateRadius < frame.nameplateHeight / 2);
  close(
    frame.nameplateLeft + frame.nameplateWidth / 2,
    (frame.outerLeft + frame.outerRight) / 2,
    "letreiro permanece centralizado apos corrigir os encaixes",
  );
});

test("cena preserva arco, contatos e volumes axiais na matriz responsiva", () => {
  for (const viewport of VIEWPORTS) {
    for (const ticks of READINGS) {
      const layout = getExternalMicrometerGeometry(
        viewport.width,
        viewport.height,
        ticks,
      );
      const label = `${viewport.name}/${ticks}`;
      const expectedB = Math.max(
        1,
        Math.min(
          viewport.width / EXTERNAL_MICROMETER_GEOMETRY_RATIOS.sceneWidth,
          viewport.height / EXTERNAL_MICROMETER_GEOMETRY_RATIOS.sceneHeight,
        ),
      );
      close(layout.B, expectedB, `${label}: escala uniforme`);
      assert.ok(layout.frameLeft >= -EPSILON, `${label}: quadro na cena`);
      assert.ok(layout.frameBottom <= viewport.height + EPSILON, `${label}: base na cena`);
      assert.ok(layout.anvilFaceX <= layout.spindleFaceX, `${label}: vão positivo`);
      assert.ok(layout.spindleFaceX <= layout.guideEntryX + EPSILON, `${label}: fuso no guia`);
      assert.ok(layout.sleeveStartX < layout.thimbleLeft, `${label}: bainha exposta`);
      assert.ok(layout.thimbleLeft < layout.thimbleConeRight, `${label}: cone`);
      assert.ok(layout.thimbleConeRight === layout.gripLeft, `${label}: costura do punho`);
      assert.ok(layout.gripRight === layout.neckLeft, `${label}: pescoço separado`);
      assert.ok(layout.neckRight === layout.ratchetLeft, `${label}: catraca separada`);
      assert.ok(layout.ratchetRight <= layout.sceneRight + EPSILON, `${label}: extremo direito`);
      assert.ok(layout.hitRight - layout.hitLeft >= 44, `${label}: alvo horizontal`);
      assert.ok(layout.hitBottom - layout.hitTop >= 44, `${label}: alvo vertical`);
    }
  }
});

test("aumento da leitura move fuso e conjunto do tambor para a direita", () => {
  for (const viewport of VIEWPORTS) {
    let previous = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      0,
    );
    for (const ticks of READINGS.slice(1)) {
      const current = getExternalMicrometerGeometry(
        viewport.width,
        viewport.height,
        ticks,
      );
      assert.ok(current.spindleFaceX >= previous.spindleFaceX);
      assert.ok(current.thimbleLeft >= previous.thimbleLeft);
      close(current.anvilFaceX, previous.anvilFaceX, `${viewport.name}: bigorna fixa`);
      close(current.sleeveStartX, previous.sleeveStartX, `${viewport.name}: bainha fixa`);
      previous = current;
    }
  }
});

test("vão, costura e escala usam o mesmo curso axial", () => {
  for (const viewport of VIEWPORTS) {
    const minimum = getExternalMicrometerGeometry(viewport.width, viewport.height, 0);
    const maximum = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      EXTERNAL_MICROMETER_MAX_TICKS,
    );
    const expectedTravel =
      (EXTERNAL_MICROMETER_MAX_TICKS / EXTERNAL_MICROMETER_TICKS_PER_MM) *
      minimum.pixelsPerMm;
    close(maximum.contactSpanPx, expectedTravel, `${viewport.name}: vão máximo`);
    close(
      maximum.thimbleLeft - minimum.thimbleLeft,
      expectedTravel,
      `${viewport.name}: curso do tambor`,
    );
    close(
      getExternalMicrometerScaleMarkX(minimum, EXTERNAL_MICROMETER_MAX_TICKS),
      maximum.thimbleLeft,
      `${viewport.name}: marca 25 compartilha o datum da costura final`,
    );
    const canonical = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      10_000,
    );
    const canonicalMarkX = getExternalMicrometerScaleMarkX(
      canonical,
      10_000,
    );
    close(
      canonicalMarkX,
      canonical.thimbleLeft,
      `${viewport.name}: marca 10 e costura do tambor compartilham o mesmo datum`,
    );
    assert.ok(
      maximum.spindleFaceX < maximum.bossLeft,
      `${viewport.name}: face do fuso permanece fora da orelha em 25 mm`,
    );
    assert.ok(
      maximum.bossLeft - maximum.spindleFaceX >= maximum.B * 0.25,
      `${viewport.name}: haste preserva trecho visivel no limite maximo`,
    );
  }
});

test("rótulo inteiro só aparece quando sua graduação alcança a costura", () => {
  for (const viewport of VIEWPORTS) {
    const nineMillimetres = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      9_000,
    );
    const immediatelyBeforeTen = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      9_999,
    );
    const tenMillimetres = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      10_000,
    );

    assert.equal(
      isExternalMicrometerScaleMarkExposed(nineMillimetres, 9_000),
      true,
      `${viewport.name}: graduação de 9 mm está exposta`,
    );
    assert.equal(
      isExternalMicrometerScaleMarkExposed(nineMillimetres, 10_000),
      false,
      `${viewport.name}: rótulo 10 não antecipa a leitura 9,000 mm`,
    );
    assert.equal(
      isExternalMicrometerScaleMarkExposed(immediatelyBeforeTen, 10_000),
      false,
      `${viewport.name}: rótulo 10 permanece oculto em 9,999 mm`,
    );
    assert.equal(
      isExternalMicrometerScaleMarkExposed(tenMillimetres, 10_000),
      true,
      `${viewport.name}: rótulo 10 aparece no datum de 10,000 mm`,
    );
  }
});

test("fase do tambor e nônio atravessam a meia volta exatamente", () => {
  const before = getExternalMicrometerGeometry(1_211, 455, 499);
  const after = getExternalMicrometerGeometry(1_211, 455, 500);
  assert.equal(before.thimbleDivision, 49);
  assert.equal(before.vernierDivision, 9);
  close(before.thimbleAngleDegrees, 359.28, "ângulo antes da volta");
  assert.equal(after.thimbleDivision, 0);
  assert.equal(after.vernierDivision, 0);
  close(after.thimbleAngleDegrees, 0, "ângulo após a volta");
});

test("as dez marcas do nônio permanecem dentro da bainha", () => {
  for (const viewport of VIEWPORTS) {
    const layout = getExternalMicrometerGeometry(
      viewport.width,
      viewport.height,
      12_507,
    );
    for (const projectionScale of [1, 6]) {
      const presentation = getExternalMicrometerVernierPresentation(
        layout,
        projectionScale,
      );
      assert.ok(
        presentation.topY >= layout.sleeveTop,
        `${viewport.name}/${projectionScale}: topo recortado`,
      );
      assert.ok(
        presentation.bottomY <= layout.sleeveBottom,
        `${viewport.name}/${projectionScale}: base recortada`,
      );
      assert.ok(
        presentation.screenFontPx >= (projectionScale > 1 ? 14 : 9),
        `${viewport.name}/${projectionScale}: fonte insuficiente`,
      );
      if (presentation.labelInterval < 10) {
        assert.ok(
          presentation.screenStepPx * presentation.labelInterval >=
            presentation.screenFontPx + 2,
          `${viewport.name}/${projectionScale}: rótulos colidem`,
        );
      }
      for (let division = 0; division < 10; division += 1) {
        const y = layout.referenceY - division * presentation.stepPx;
        assert.ok(y >= layout.sleeveTop && y <= layout.sleeveBottom);
      }
    }
  }
});

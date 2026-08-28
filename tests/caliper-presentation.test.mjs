import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIPER_SCALE_LEGIBILITY,
  getCaliperDetailZoom,
  getScalePresentation,
  getVernierLabelInterval,
} from "../lib/caliper-presentation.ts";

const LANDMARKS = {
  beamY: 200,
  beamHeight: 100,
  sliderTop: 158,
  upperPlateBottom: 218,
  vernierTop: 282,
  vernierBottom: 325,
};

test("projeção métrica encontra escala principal e nônio na mesma costura", () => {
  assert.deepEqual(getScalePresentation("mm", LANDMARKS), {
    mainTickBaselineY: 282,
    mainTickDirection: -1,
    mainLabelY: 240,
    unitLabelY: 222,
    vernierPlate: "lower",
    vernierTickBaselineY: 282,
    vernierTickDirection: 1,
    vernierLabelY: 319,
    detailFocusY: 282,
  });
});

test("projeção em polegadas dispõe nônio acima e escala principal abaixo", () => {
  const presentation = getScalePresentation("in", LANDMARKS);

  assert.equal(presentation.vernierPlate, "upper");
  assert.equal(presentation.vernierTickDirection, -1);
  assert.equal(presentation.mainTickDirection, 1);
  assert.equal(
    presentation.vernierTickBaselineY,
    presentation.mainTickBaselineY,
    "as linhas-base devem coincidir exatamente",
  );
  assert.ok(presentation.vernierLabelY < presentation.vernierTickBaselineY);
  assert.ok(presentation.mainLabelY > presentation.mainTickBaselineY);
  assert.equal(presentation.detailFocusY, presentation.mainTickBaselineY);
});

test("as duas resoluções em polegadas compartilham a mesma projeção", () => {
  const fractional = getScalePresentation("in", LANDMARKS);
  const decimal = getScalePresentation("in", LANDMARKS);
  assert.deepEqual(fractional, decimal);
});

test("nônio fracionário preserva 0, 4 e 8 quando há espaço", () => {
  const interval = getVernierLabelInterval("in-1/128", 8, 4);
  const numberedMarks = Array.from(
    { length: 9 },
    (_, index) => index,
  ).filter((index) => index % interval === 0);

  assert.equal(interval, 4);
  assert.deepEqual(numberedMarks, [0, 4, 8]);
});

test("nônio fracionário reduz rótulos antes de permitir colisão", () => {
  assert.equal(getVernierLabelInterval("in-1/128", 8, 2), 8);
});

test("lupa prioriza passo legível e limita o zoom por viewport", () => {
  const mobileZoom = getCaliperDetailZoom(320, 0.81, 4.2);
  const landscapeZoom = getCaliperDetailZoom(844, 0.81, 2.4);
  const desktopZoom = getCaliperDetailZoom(1_211, 2.7, 4.5);

  assert.equal(mobileZoom, 4.2);
  assert.equal(landscapeZoom, 3.6);
  assert.equal(desktopZoom, 2.8);
  assert.ok(
    mobileZoom * 0.81 >= CALIPER_SCALE_LEGIBILITY.minimumDetailPitchPx,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
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
    unitLabelY: 216,
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

test("nônio fracionário numera somente 0, 4 e 8 como na referência", () => {
  const interval = getVernierLabelInterval("in-1/128", 8, 2);
  const numberedMarks = Array.from(
    { length: 9 },
    (_, index) => index,
  ).filter((index) => index % interval === 0);

  assert.equal(interval, 4);
  assert.deepEqual(numberedMarks, [0, 4, 8]);
});

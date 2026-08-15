import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIPER_SCALE_LIST,
  CALIPER_SCALES,
  DEFAULT_CALIPER_MAX_TICKS,
  mmToTicks,
  snapCaliperTicks,
  ticksToMm,
} from "../lib/caliper.ts";
import {
  CALIPER_GEOMETRY_RATIOS,
  getCaliperGeometry,
  getVernierPitchMm,
} from "../lib/caliper-geometry.ts";

const EPSILON = 1e-9;
const VIEWPORTS = [
  { name: "desktop", width: 1211, height: 455 },
  { name: "celular horizontal", width: 827, height: 380 },
  { name: "estreito", width: 320, height: 380 },
];

function close(actual, expected, message, tolerance = EPSILON) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: esperado ${expected}, recebido ${actual}`,
  );
}

function geometryForTicks(viewport, ticks, scale) {
  return getCaliperGeometry(
    viewport.width,
    viewport.height,
    ticksToMm(ticks),
    scale,
  );
}

function maximumTicksFor(scale) {
  return snapCaliperTicks(
    DEFAULT_CALIPER_MAX_TICKS,
    scale,
    0,
    DEFAULT_CALIPER_MAX_TICKS,
  );
}

function readingsFor(scale) {
  const readings = new Set([
    0,
    snapCaliperTicks(mmToTicks(75), scale),
    maximumTicksFor(scale),
  ]);

  for (const valueMm of [43.05, 58.35, 58.36]) {
    const ticks = mmToTicks(valueMm);
    if (ticks % scale.stepTicks === 0) readings.add(ticks);
  }

  return [...readings].sort((left, right) => left - right);
}

function assertRatios(layout, label) {
  const r = CALIPER_GEOMETRY_RATIOS;
  const B = layout.B;

  close(layout.beamHeight / B, r.beamHeight, `${label}: altura da viga`);
  close((layout.beamY - layout.upperTipY) / B, r.upperTipAboveBeam, `${label}: ponta interna`);
  close((layout.beamY - layout.internalShelfY) / B, r.internalShelfAboveBeam, `${label}: patamar interno`);
  close((layout.contactTopY - layout.beamBottom) / B, r.contactTopBelowBeam, `${label}: inicio do mordente externo`);
  close((layout.jawBottom - layout.beamBottom) / B, r.jawBottomBelowBeam, `${label}: comprimento do mordente externo`);
  close(layout.externalJawSpan / B, r.externalJawSpan, `${label}: ombro externo`);
  close(layout.heelSpan / B, r.heelSpan, `${label}: calcanhar externo`);
  close(layout.scaleToContactOffset / B, r.scaleToContactOffset, `${label}: face para zero`);
  close((layout.upperPlateBottom - layout.sliderTop) / B, r.upperPlateHeight, `${label}: altura da placa superior`);
  close((layout.vernierTop - layout.beamY) / B, r.vernierTopBelowBeamTop, `${label}: topo do nonio`);
  close((layout.vernierBottom - layout.vernierTop) / B, r.vernierHeight, `${label}: altura do nonio`);
  close((layout.sliderRight - layout.upperPlateLeft) / B, r.upperPlateWidth, `${label}: largura do cursor`);
  close(layout.rollerRadius / B, r.rollerRadius, `${label}: raio do rolete`);
}

function assertNonIntersectingEnvelope(layout, width, height, scale, label) {
  const r = CALIPER_GEOMETRY_RATIOS;
  const sceneBottom = layout.originY + r.sceneHeight * layout.B;
  const movingShoulderX = layout.movingContactX + layout.externalJawSpan;
  const vernierEndX = layout.movingScaleZeroX + scale.vernierDivisions * layout.vernierStepPx;

  assert.ok(layout.originX >= -EPSILON, `${label}: cena inicia dentro do canvas`);
  assert.ok(layout.originY >= -EPSILON, `${label}: cena inicia verticalmente dentro do canvas`);
  assert.ok(layout.sceneRight <= width + EPSILON, `${label}: cena termina dentro do canvas`);
  assert.ok(sceneBottom <= height + EPSILON, `${label}: cena termina verticalmente dentro do canvas`);

  assert.ok(layout.upperTipY < layout.internalShelfY, `${label}: ponta acima do patamar`);
  close(layout.sliderTop, layout.internalShelfY, `${label}: cursor e patamar compartilham o topo`);
  assert.ok(layout.internalShelfY < layout.beamY, `${label}: patamar acima da viga`);
  assert.ok(layout.beamY < layout.upperPlateBottom, `${label}: placa cruza a viga sem inverter`);
  assert.ok(layout.upperPlateBottom < layout.vernierTop, `${label}: faixa principal exposta`);
  assert.ok(layout.vernierTop < layout.beamBottom, `${label}: costura do nonio dentro da viga`);
  assert.ok(layout.beamBottom < layout.vernierBottom, `${label}: nonio atravessa o fundo da viga`);
  close(layout.vernierBottom, layout.contactTopY, `${label}: nonio conectado aos mordentes externos`);
  assert.ok(layout.contactTopY < layout.jawBottom, `${label}: mordente possui comprimento positivo`);
  assert.ok(layout.jawBottom < layout.dimensionY, `${label}: cota fica abaixo do mordente`);
  assert.ok(layout.dimensionY < sceneBottom, `${label}: cota permanece na cena`);

  assert.ok(layout.side < layout.fixedInternalFaceX, `${label}: face interna fixa apos a lateral`);
  assert.ok(layout.fixedInternalFaceX < layout.fixedContactX, `${label}: faces fixas sem inversao`);
  assert.ok(layout.fixedContactX < layout.mainZeroX, `${label}: zero apos a face externa fixa`);
  assert.ok(layout.movingInternalRootX < layout.movingInternalFaceX, `${label}: raiz interna antes da face`);
  assert.ok(layout.movingInternalFaceX < layout.movingContactX, `${label}: face interna antes da externa`);
  assert.ok(layout.movingContactX < movingShoulderX, `${label}: ombro movel sem inversao`);
  assert.ok(layout.movingContactX < layout.upperPlateLeft, `${label}: placa inicia apos a face movel`);
  assert.ok(layout.upperPlateLeft < layout.screwX, `${label}: parafuso dentro da placa`);
  assert.ok(layout.screwX < layout.rollerX, `${label}: rolete apos o parafuso`);
  assert.ok(layout.rollerX < layout.sliderRight, `${label}: rolete dentro da placa`);
  assert.ok(vernierEndX <= layout.sliderRight + EPSILON, `${label}: nonio termina dentro da placa`);
  assert.ok(layout.sliderRight <= layout.sceneRight + EPSILON, `${label}: cursor termina dentro da area tecnica`);
  assert.ok(layout.rollerX + layout.rollerRadius <= layout.sceneRight + EPSILON, `${label}: rolete termina dentro da area tecnica`);
  assert.ok(layout.beamEnd <= layout.sceneRight + EPSILON, `${label}: viga termina dentro da area tecnica`);
}

test("proporcoes canonicas e envelopes permanecem validos na matriz responsiva", () => {
  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      for (const ticks of readingsFor(scale)) {
        const label = `${viewport.name}/${scale.id}/${ticksToMm(ticks)} mm`;
        const layout = geometryForTicks(viewport, ticks, scale);
        const expectedB = Math.max(
          1,
          Math.min(
            viewport.width / CALIPER_GEOMETRY_RATIOS.sceneWidth,
            viewport.height / CALIPER_GEOMETRY_RATIOS.sceneHeight,
          ),
        );

        close(layout.B, expectedB, `${label}: escala uniforme`);
        assertRatios(layout, label);
        assertNonIntersectingEnvelope(layout, viewport.width, viewport.height, scale, label);
      }
    }
  }
});

test("faces, zeros, profundidade e degrau usam exatamente a mesma translacao", () => {
  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      for (const ticks of readingsFor(scale)) {
        const valueMm = ticksToMm(ticks);
        const label = `${viewport.name}/${scale.id}/${valueMm} mm`;
        const layout = geometryForTicks(viewport, ticks, scale);
        const expectedTravel = valueMm * layout.pixelsPerMm;

        close(layout.travelPx, expectedTravel, `${label}: deslocamento/profundidade`);
        close(layout.movingContactX - layout.fixedContactX, expectedTravel, `${label}: faces externas`);
        close(layout.movingScaleZeroX - layout.mainZeroX, expectedTravel, `${label}: zeros`);
        close(layout.movingInternalFaceX - layout.fixedInternalFaceX, expectedTravel, `${label}: faces internas`);
        close(layout.movingStepDatumX - layout.fixedStepDatumX, expectedTravel, `${label}: faces de degrau`);

        // A haste fica recolhida em beamEnd e sua ponta tecnica avanca travelPx.
        const depthTipX = layout.beamEnd + layout.travelPx;
        close(depthTipX - layout.beamEnd, expectedTravel, `${label}: haste de profundidade`);
      }
    }
  }
});

test("o cursor inteiro e rigido do zero ao fim do curso", () => {
  const movingX = [
    "movingScaleZeroX",
    "movingContactX",
    "movingInternalRootX",
    "movingInternalFaceX",
    "upperPlateLeft",
    "sliderRight",
    "screwX",
    "rollerX",
    "movingStepDatumX",
  ];
  const fixed = [
    "B",
    "originX",
    "originY",
    "side",
    "fixedContactX",
    "fixedInternalFaceX",
    "mainZeroX",
    "beamEnd",
    "beamY",
    "beamBottom",
    "contactTopY",
    "jawBottom",
    "sliderTop",
    "upperPlateBottom",
    "vernierTop",
    "vernierBottom",
    "screwTop",
    "rollerRadius",
    "fixedStepDatumX",
  ];

  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      const closed = geometryForTicks(viewport, 0, scale);
      for (const ticks of readingsFor(scale)) {
        const layout = geometryForTicks(viewport, ticks, scale);
        const label = `${viewport.name}/${scale.id}/${ticksToMm(ticks)} mm`;

        for (const key of movingX) {
          close(layout[key] - closed[key], layout.travelPx, `${label}: translacao rigida de ${key}`);
        }
        for (const key of fixed) {
          close(layout[key], closed[key], `${label}: landmark fixo ${key}`);
        }

        close(layout.sliderRight - layout.upperPlateLeft, closed.sliderRight - closed.upperPlateLeft, `${label}: largura da placa`);
        close(layout.screwX - layout.upperPlateLeft, closed.screwX - closed.upperPlateLeft, `${label}: offset do parafuso`);
        close(layout.rollerX - layout.upperPlateLeft, closed.rollerX - closed.upperPlateLeft, `${label}: offset do rolete`);
        close(layout.movingScaleZeroX - layout.upperPlateLeft, closed.movingScaleZeroX - closed.upperPlateLeft, `${label}: recuo do zero no cursor`);
        close(layout.vernierStepPx, closed.vernierStepPx, `${label}: passo do nonio`);
      }
    }
  }
});

test("no fechamento todos os datums moveis coincidem com seus pares fixos", () => {
  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      const layout = geometryForTicks(viewport, 0, scale);
      const label = `${viewport.name}/${scale.id}`;

      close(layout.travelPx, 0, `${label}: deslocamento zero`);
      close(layout.movingContactX, layout.fixedContactX, `${label}: faces externas fechadas`);
      close(layout.movingScaleZeroX, layout.mainZeroX, `${label}: zeros fechados`);
      close(layout.movingInternalFaceX, layout.fixedInternalFaceX, `${label}: faces internas fechadas`);
      close(layout.movingInternalRootX, layout.side, `${label}: raiz interna fechada`);
      close(layout.movingStepDatumX, layout.fixedStepDatumX, `${label}: degrau fechado`);
    }
  }
});

test("nonios estendidos alinham as marcas didaticas exatas", () => {
  const viewport = VIEWPORTS[0];
  const scale005 = CALIPER_SCALES["mm-0.05"];
  const layout005 = getCaliperGeometry(viewport.width, viewport.height, 58.35, scale005);

  close(getVernierPitchMm(scale005), 1.95, "passo fisico do nonio 0,05");
  close(layout005.vernierStepPx, 1.95 * layout005.pixelsPerMm, "passo projetado do nonio 0,05");
  close(
    layout005.movingScaleZeroX + 7 * layout005.vernierStepPx,
    layout005.mainZeroX + 72 * layout005.pixelsPerMm,
    "58,35 mm: marca 7 encontra 72 mm",
  );

  const scale002 = CALIPER_SCALES["mm-0.02"];
  const layout002 = getCaliperGeometry(viewport.width, viewport.height, 58.36, scale002);
  close(getVernierPitchMm(scale002), 0.98, "passo fisico do nonio 0,02");
  close(layout002.vernierStepPx, 0.98 * layout002.pixelsPerMm, "passo projetado do nonio 0,02");
  close(
    layout002.movingScaleZeroX + 18 * layout002.vernierStepPx,
    layout002.mainZeroX + 76 * layout002.pixelsPerMm,
    "58,36 mm: marca 18 encontra 76 mm",
  );
});

test("todos os passos de nonio correspondem ao contrato fisico de cada escala", () => {
  const expectedPitchMm = {
    "mm-0.1": 1.9,
    "mm-0.05": 1.95,
    "mm-0.02": 0.98,
    "in-1/128": (7 / 128) * 25.4,
    "in-0.001": 0.024 * 25.4,
  };

  for (const scale of CALIPER_SCALE_LIST) {
    close(getVernierPitchMm(scale), expectedPitchMm[scale.id], scale.id);
  }
});

test("maximos em polegadas respeitam a faixa fisica de 150 mm", () => {
  const fractionalTicks = maximumTicksFor(CALIPER_SCALES["in-1/128"]);
  const decimalTicks = maximumTicksFor(CALIPER_SCALES["in-0.001"]);

  assert.equal(ticksToMm(fractionalTicks), 149.8203125);
  assert.equal(ticksToMm(decimalTicks), 149.987);
  assert.equal(fractionalTicks, 755 * CALIPER_SCALES["in-1/128"].stepTicks);
  assert.equal(decimalTicks, 5905 * CALIPER_SCALES["in-0.001"].stepTicks);
});

test("escala principal termina em 150 mm e preserva somente a cauda tecnica", () => {
  const r = CALIPER_GEOMETRY_RATIOS;

  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      const layout = geometryForTicks(viewport, 0, scale);
      const scaleEndX = layout.mainZeroX + 150 * layout.pixelsPerMm;
      const label = `${viewport.name}/${scale.id}`;

      close((scaleEndX - layout.mainZeroX) / layout.B, r.scaleSpan150Mm, `${label}: vao calibrado de 150 mm`);
      close((layout.beamEnd - scaleEndX) / layout.B, r.beamTail, `${label}: cauda da viga`);
      assert.ok(scaleEndX < layout.beamEnd, `${label}: graduacao 150 antes do fim da viga`);
    }
  }
});

test("landmarks fornecem regioes coerentes para hit-testing do conjunto movel", () => {
  for (const viewport of VIEWPORTS) {
    for (const scale of CALIPER_SCALE_LIST) {
      for (const ticks of readingsFor(scale)) {
        const layout = geometryForTicks(viewport, ticks, scale);
        const label = `${viewport.name}/${scale.id}/${ticksToMm(ticks)} mm`;
        const plateCenterX = (layout.upperPlateLeft + layout.sliderRight) / 2;
        const plateCenterY = (layout.sliderTop + layout.upperPlateBottom) / 2;
        const vernierCenterY = (layout.vernierTop + layout.vernierBottom) / 2;

        assert.ok(plateCenterX >= layout.upperPlateLeft && plateCenterX <= layout.sliderRight, `${label}: centro X da placa`);
        assert.ok(plateCenterY >= layout.sliderTop && plateCenterY <= layout.upperPlateBottom, `${label}: centro Y da placa`);
        assert.ok(layout.movingScaleZeroX >= layout.upperPlateLeft && layout.movingScaleZeroX <= layout.sliderRight, `${label}: zero dentro da placa`);
        assert.ok(vernierCenterY >= layout.vernierTop && vernierCenterY <= layout.vernierBottom, `${label}: centro Y do nonio`);
        assert.ok(layout.screwX >= layout.upperPlateLeft && layout.screwX <= layout.sliderRight, `${label}: parafuso atingivel`);
        assert.ok(layout.rollerX >= layout.upperPlateLeft && layout.rollerX <= layout.sliderRight, `${label}: rolete atingivel`);
        assert.ok(layout.movingContactX <= layout.upperPlateLeft, `${label}: mordente ligado ao cursor`);
      }
    }
  }
});

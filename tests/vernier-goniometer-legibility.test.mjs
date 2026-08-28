import assert from "node:assert/strict";
import test from "node:test";

import {
  getGoniometerScalePresentation,
  getGoniometerVernierMarkAngleDegrees,
  getVernierGoniometerDetailViewport,
  getVernierGoniometerGeometry,
} from "../lib/vernier-goniometer-geometry.ts";

const VIEWPORTS = [
  { name: "desktop", width: 1_211, height: 455 },
  { name: "celular horizontal", width: 844, height: 390 },
  { name: "mínimo", width: 320, height: 380 },
];

function labelRadius(presentation, division) {
  if (division === 12) return presentation.vernierEndpointLabelRadius;
  if (division % 6 === 0) return presentation.vernierInnerLabelRadius;
  return presentation.vernierOuterLabelRadius;
}

function pointOnCircle(radius, angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180;
  return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
}

test("projeção ampliada torna cada grau e os rótulos do nônio distinguíveis", () => {
  for (const viewport of VIEWPORTS) {
    const layout = getVernierGoniometerGeometry(
      viewport.width,
      viewport.height,
      3_150,
    );
    const detail = getVernierGoniometerDetailViewport(
      viewport.width,
      viewport.height,
      layout,
    );
    const presentation = getGoniometerScalePresentation(layout, detail.zoom);
    const screenFont = presentation.vernierLabelFontPx * detail.zoom;
    const oneDegreePitch = layout.scaleRadius * (Math.PI / 180) * detail.zoom;

    assert.ok(screenFont >= 14, `${viewport.name}: fonte ampliada`);
    assert.ok(oneDegreePitch >= 2 - 1e-9, `${viewport.name}: passo de um grau`);
    assert.deepEqual(presentation.vernierLabelDivisions, [3, 6, 9, 12]);
    assert.ok(
      (presentation.mainLabelRadius - presentation.vernierPlateOuterRadius) *
        detail.zoom >=
        presentation.mainLabelFontPx * detail.zoom,
      `${viewport.name}: números principais livres da borda do nônio`,
    );

    const labels = presentation.vernierLabelDivisions.map((division) => {
      const angle = getGoniometerVernierMarkAngleDegrees(3_150, division, -1);
      const point = pointOnCircle(labelRadius(presentation, division), angle);
      return { division, x: point.x * detail.zoom, y: point.y * detail.zoom };
    });
    for (let left = 0; left < labels.length; left += 1) {
      for (let right = left + 1; right < labels.length; right += 1) {
        const distance = Math.hypot(
          labels[left].x - labels[right].x,
          labels[left].y - labels[right].y,
        );
        assert.ok(
          distance >= screenFont + 2,
          `${viewport.name}: ${labels[left].division}/${labels[right].division} colidem`,
        );
      }
    }
  }
});

test("visão geral compacta reduz rótulos sem remover marcas físicas", () => {
  const layout = getVernierGoniometerGeometry(320, 380, 3_150);
  const presentation = getGoniometerScalePresentation(layout, 1);

  assert.deepEqual(presentation.vernierLabelDivisions, [6, 12]);
  assert.equal(presentation.mainLabelIntervalDegrees, 30);
  assert.ok(presentation.vernierLabelFontPx >= 9);
});

test("visão geral mantém apenas 30 e 60 minutos no nônio físico", () => {
  for (const viewport of VIEWPORTS) {
    const layout = getVernierGoniometerGeometry(
      viewport.width,
      viewport.height,
      3_150,
    );
    const presentation = getGoniometerScalePresentation(layout, 1);
    assert.deepEqual(
      presentation.vernierLabelDivisions,
      [6, 12],
      `${viewport.name}: densidade do nônio`,
    );
    assert.ok(
      presentation.mainLabelRadius > presentation.vernierPlateOuterRadius,
      `${viewport.name}: pistas radiais separadas`,
    );
  }
});

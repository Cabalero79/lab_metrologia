import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIPER_SCALE_LIST,
  CALIPER_TICKS_PER_INCH,
  CALIPER_TICKS_PER_MM,
  DEFAULT_CALIPER_MAX_TICKS,
  formatCaliperReading,
  quantizeForScale,
  snapCaliperTicks,
} from "../lib/caliper.ts";

const KNOWN_READINGS = [
  { scale: "mm-0.1", ticks: 0, display: "0,0 mm" },
  { scale: "mm-0.1", ticks: 8_000, display: "0,1 mm" },
  { scale: "mm-0.05", ticks: 988_000, display: "12,35 mm" },
  { scale: "mm-0.02", ticks: 987_200, display: "12,34 mm" },
  { scale: "in-1/128", ticks: 1_016_000, display: "1/2″" },
  { scale: "in-1/128", ticks: 3_048_000, display: "1 1/2″" },
  { scale: "in-0.001", ticks: 254_000, display: "0,125″" },
];

test("fixtures metrológicas conhecidas permanecem independentes da interface", () => {
  for (const fixture of KNOWN_READINGS) {
    assert.equal(
      formatCaliperReading(fixture.ticks, fixture.scale),
      fixture.display,
      fixture.scale,
    );
  }
});

test("metadados de toda escala formam um contrato físico coerente", () => {
  assert.equal(CALIPER_TICKS_PER_INCH, CALIPER_TICKS_PER_MM * 25.4);

  for (const scale of CALIPER_SCALE_LIST) {
    assert.ok(Number.isSafeInteger(scale.stepTicks));
    assert.ok(scale.stepTicks > 0);
    assert.ok(scale.vernierDivisions > 0);
    assert.equal(
      scale.stepTicks * scale.resolution.denominator,
      (scale.unit === "mm" ? CALIPER_TICKS_PER_MM : CALIPER_TICKS_PER_INCH) *
        scale.resolution.numerator,
      scale.id,
    );

    if (scale.format === "fraction") {
      assert.ok(scale.fractionDenominator);
      assert.equal(CALIPER_TICKS_PER_INCH % scale.fractionDenominator, 0);
    } else {
      assert.ok(Number.isSafeInteger(scale.decimalPlaces));
    }
  }
});

test("quantização é idempotente e monotônica em todos os passos da faixa", () => {
  for (const scale of CALIPER_SCALE_LIST) {
    const maximum = snapCaliperTicks(
      DEFAULT_CALIPER_MAX_TICKS,
      scale,
      0,
      DEFAULT_CALIPER_MAX_TICKS,
    );
    let previous = -1;

    for (let ticks = 0; ticks <= maximum; ticks += scale.stepTicks) {
      const snapped = snapCaliperTicks(
        ticks,
        scale,
        0,
        DEFAULT_CALIPER_MAX_TICKS,
      );
      assert.equal(snapped, ticks, `${scale.id} em ${ticks}`);
      assert.equal(quantizeForScale(snapped, scale), snapped);
      assert.ok(snapped > previous, `${scale.id} deve crescer monotonamente`);
      assert.doesNotMatch(formatCaliperReading(snapped, scale), /NaN|Infinity/);
      previous = snapped;
    }
  }
});

test("limites arbitrários sempre resultam em leituras representáveis", () => {
  for (const scale of CALIPER_SCALE_LIST) {
    const below = snapCaliperTicks(-123_456, scale);
    const above = snapCaliperTicks(DEFAULT_CALIPER_MAX_TICKS + 123_456, scale);

    assert.equal(below, 0, scale.id);
    assert.ok(above <= DEFAULT_CALIPER_MAX_TICKS, scale.id);
    assert.equal(above % scale.stepTicks, 0, scale.id);
  }
});

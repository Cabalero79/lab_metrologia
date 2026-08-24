import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_PROFILE,
  INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  INTERNAL_MICROMETER_THIMBLE_DIVISIONS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeInternalMicrometerReading,
  formatInternalMicrometerBreakdown,
  formatInternalMicrometerReading,
  internalMicrometerTicksToMm,
  mmToInternalMicrometerTicks,
  snapInternalMicrometerTicks,
  stepInternalMicrometerTicks,
} from "../lib/internal-micrometer.ts";

const FIXTURES = [
  { ticks: 500, display: "5,00 mm", sleeve: 500, thimble: 0, angle: 0 },
  { ticks: 501, display: "5,01 mm", sleeve: 500, thimble: 1, angle: 7.2 },
  { ticks: 524, display: "5,24 mm", sleeve: 500, thimble: 24, angle: 172.8 },
  { ticks: 525, display: "5,25 mm", sleeve: 500, thimble: 25, angle: 180 },
  { ticks: 549, display: "5,49 mm", sleeve: 500, thimble: 49, angle: 352.8 },
  { ticks: 550, display: "5,50 mm", sleeve: 550, thimble: 0, angle: 0 },
  { ticks: 599, display: "5,99 mm", sleeve: 550, thimble: 49, angle: 352.8 },
  { ticks: 600, display: "6,00 mm", sleeve: 600, thimble: 0, angle: 0 },
  { ticks: 736, display: "7,36 mm", sleeve: 700, thimble: 36, angle: 259.2 },
  { ticks: 786, display: "7,86 mm", sleeve: 750, thimble: 36, angle: 259.2 },
  { ticks: 999, display: "9,99 mm", sleeve: 950, thimble: 49, angle: 352.8 },
  { ticks: 1_000, display: "10,00 mm", sleeve: 1_000, thimble: 0, angle: 0 },
  { ticks: 1_499, display: "14,99 mm", sleeve: 1_450, thimble: 49, angle: 352.8 },
  { ticks: 1_500, display: "15,00 mm", sleeve: 1_500, thimble: 0, angle: 0 },
];

test("perfil centesimal mantém o contrato físico inteiro", () => {
  assert.equal(INTERNAL_MICROMETER_TICKS_PER_MM, 100);
  assert.equal(INTERNAL_MICROMETER_MIN_TICKS, 500);
  assert.equal(INTERNAL_MICROMETER_MAX_TICKS, 1_500);
  assert.equal(INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS, 50);
  assert.equal(INTERNAL_MICROMETER_THIMBLE_DIVISIONS, 50);
  assert.equal(
    INTERNAL_MICROMETER_PROFILE.spindlePitchTicks,
    INTERNAL_MICROMETER_PROFILE.thimbleDivisions *
      INTERNAL_MICROMETER_PROFILE.resolutionTicks,
  );
  assert.equal(
    (INTERNAL_MICROMETER_MAX_TICKS - INTERNAL_MICROMETER_MIN_TICKS) /
      INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    20,
  );
});

test("fixtures independentes recompõem bainha, tambor, ângulo e leitura", () => {
  for (const fixture of FIXTURES) {
    const parts = decomposeInternalMicrometerReading(fixture.ticks);
    assert.equal(parts.sleeveTicks, fixture.sleeve, fixture.display);
    assert.equal(parts.thimbleTicks, fixture.thimble, fixture.display);
    assert.equal(parts.thimbleDivision, fixture.thimble, fixture.display);
    assert.equal(parts.sleeveTicks + parts.thimbleTicks, fixture.ticks);
    assert.ok(
      Math.abs(parts.thimbleAngleDegrees - fixture.angle) < 1e-9,
      fixture.display,
    );
    assert.equal(formatInternalMicrometerReading(fixture.ticks), fixture.display);
  }
});

test("meia marca da bainha não se perde na decomposição didática", () => {
  const before = decomposeInternalMicrometerReading(736);
  const after = decomposeInternalMicrometerReading(786);

  assert.equal(before.wholeMillimetreTicks, 700);
  assert.equal(before.halfMillimetreTicks, 0);
  assert.equal(after.wholeMillimetreTicks, 700);
  assert.equal(after.halfMillimetreTicks, 50);
  assert.equal(formatInternalMicrometerBreakdown(before), "7,00 mm + 0,36 mm");
  assert.equal(formatInternalMicrometerBreakdown(after), "7,50 mm + 0,36 mm");
});

test("todos os 1001 valores válidos são exatos, idempotentes e monotônicos", () => {
  let previous = -Infinity;
  for (
    let ticks = INTERNAL_MICROMETER_MIN_TICKS;
    ticks <= INTERNAL_MICROMETER_MAX_TICKS;
    ticks += 1
  ) {
    assert.equal(snapInternalMicrometerTicks(ticks), ticks);
    assert.ok(ticks > previous);
    assert.doesNotMatch(formatInternalMicrometerReading(ticks), /NaN|Infinity/);
    previous = ticks;
  }
});

test("conversão, quantização e limites não acumulam deriva", () => {
  assert.equal(mmToInternalMicrometerTicks(7.36), 736);
  assert.equal(internalMicrometerTicksToMm(736), 7.36);
  assert.equal(snapInternalMicrometerTicks(499.49), 500);
  assert.equal(snapInternalMicrometerTicks(1_500.51), 1_500);
  assert.equal(snapInternalMicrometerTicks(736.5), 737);

  let ticks = INTERNAL_MICROMETER_MIN_TICKS;
  for (let index = 0; index < 1_000; index += 1) {
    ticks = stepInternalMicrometerTicks(ticks, 1);
  }
  assert.equal(ticks, INTERNAL_MICROMETER_MAX_TICKS);
  for (let index = 0; index < 1_000; index += 1) {
    ticks = stepInternalMicrometerTicks(ticks, -1);
  }
  assert.equal(ticks, INTERNAL_MICROMETER_MIN_TICKS);
});

test("entradas não finitas são rejeitadas", () => {
  assert.throws(() => snapInternalMicrometerTicks(Number.NaN), RangeError);
  assert.throws(() => mmToInternalMicrometerTicks(Number.POSITIVE_INFINITY), RangeError);
});


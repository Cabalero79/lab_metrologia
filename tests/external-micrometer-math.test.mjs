import assert from "node:assert/strict";
import test from "node:test";

import {
  EXTERNAL_MICROMETER_MAX_TICKS,
  EXTERNAL_MICROMETER_PROFILES,
  EXTERNAL_MICROMETER_PROFILE,
  EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  EXTERNAL_MICROMETER_THIMBLE_DIVISIONS,
  EXTERNAL_MICROMETER_TICKS_PER_MM,
  EXTERNAL_MICROMETER_VERNIER_DIVISIONS,
  decomposeExternalMicrometerReading,
  externalMicrometerTicksToMm,
  formatExternalMicrometerBreakdown,
  formatExternalMicrometerReading,
  mmToExternalMicrometerTicks,
  snapExternalMicrometerTicks,
} from "../lib/external-micrometer.ts";

const FIXTURES = [
  { ticks: 0, display: "0,000 mm", sleeve: 0, thimble: 0, vernier: 0 },
  { ticks: 1, display: "0,001 mm", sleeve: 0, thimble: 0, vernier: 1 },
  { ticks: 499, display: "0,499 mm", sleeve: 0, thimble: 490, vernier: 9 },
  { ticks: 500, display: "0,500 mm", sleeve: 500, thimble: 0, vernier: 0 },
  { ticks: 1_234, display: "1,234 mm", sleeve: 1_000, thimble: 230, vernier: 4 },
  { ticks: 5_000, display: "5,000 mm", sleeve: 5_000, thimble: 0, vernier: 0 },
  { ticks: 12_507, display: "12,507 mm", sleeve: 12_500, thimble: 0, vernier: 7 },
  { ticks: 24_999, display: "24,999 mm", sleeve: 24_500, thimble: 490, vernier: 9 },
  { ticks: 25_000, display: "25,000 mm", sleeve: 25_000, thimble: 0, vernier: 0 },
];

const CENTESIMAL_FIXTURES = [
  { ticks: 0, display: "0,00 mm", sleeve: 0, thimble: 0 },
  { ticks: 10, display: "0,01 mm", sleeve: 0, thimble: 10 },
  { ticks: 490, display: "0,49 mm", sleeve: 0, thimble: 490 },
  { ticks: 500, display: "0,50 mm", sleeve: 500, thimble: 0 },
  { ticks: 1_230, display: "1,23 mm", sleeve: 1_000, thimble: 230 },
  { ticks: 5_500, display: "5,50 mm", sleeve: 5_500, thimble: 0 },
  { ticks: 12_510, display: "12,51 mm", sleeve: 12_500, thimble: 10 },
  { ticks: 24_990, display: "24,99 mm", sleeve: 24_500, thimble: 490 },
  { ticks: 25_000, display: "25,00 mm", sleeve: 25_000, thimble: 0 },
];

test("perfil milesimal preserva faixa, passo, tambor e nônio", () => {
  assert.equal(EXTERNAL_MICROMETER_TICKS_PER_MM, 1_000);
  assert.equal(EXTERNAL_MICROMETER_MAX_TICKS, 25_000);
  assert.equal(EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS, 500);
  assert.equal(EXTERNAL_MICROMETER_THIMBLE_DIVISIONS, 50);
  assert.equal(EXTERNAL_MICROMETER_VERNIER_DIVISIONS, 10);
  assert.equal(EXTERNAL_MICROMETER_PROFILE.resolutionTicks, 1);
  assert.equal(EXTERNAL_MICROMETER_PROFILES["external-mm-0.01"].resolutionTicks, 10);
});

test("fixtures centesimais quantizam, recompõem e formatam sem nônio", () => {
  for (const fixture of CENTESIMAL_FIXTURES) {
    const snapped = snapExternalMicrometerTicks(
      fixture.ticks,
      "external-mm-0.01",
    );
    const reading = decomposeExternalMicrometerReading(snapped);
    assert.equal(reading.sleeveTicks, fixture.sleeve, fixture.display);
    assert.equal(reading.thimbleTicks, fixture.thimble, fixture.display);
    assert.equal(reading.vernierTicks, 0, fixture.display);
    assert.equal(
      reading.sleeveTicks + reading.thimbleTicks,
      fixture.ticks,
      fixture.display,
    );
    assert.equal(
      formatExternalMicrometerReading(
        fixture.ticks,
        true,
        "external-mm-0.01",
      ),
      fixture.display,
    );
  }
});

test("fixtures recompõem bainha, tambor, nônio e leitura", () => {
  for (const fixture of FIXTURES) {
    const reading = decomposeExternalMicrometerReading(fixture.ticks);
    assert.equal(reading.sleeveTicks, fixture.sleeve, fixture.display);
    assert.equal(reading.thimbleTicks, fixture.thimble, fixture.display);
    assert.equal(reading.vernierTicks, fixture.vernier, fixture.display);
    assert.equal(
      reading.sleeveTicks + reading.thimbleTicks + reading.vernierTicks,
      fixture.ticks,
      fixture.display,
    );
    assert.equal(formatExternalMicrometerReading(fixture.ticks), fixture.display);
  }
});

test("decomposição didática explicita os três termos", () => {
  const reading = decomposeExternalMicrometerReading(1_234);
  assert.equal(
    formatExternalMicrometerBreakdown(reading),
    "1,000 mm + 0,230 mm + 0,004 mm",
  );
  assert.equal(reading.thimbleDivision, 23);
  assert.equal(reading.vernierDivision, 4);
  assert.ok(Math.abs(reading.thimbleAngleDegrees - 168.48) < 1e-9);
});

test("decomposição centesimal explicita bainha e tambor", () => {
  const reading = decomposeExternalMicrometerReading(1_230);
  assert.equal(
    formatExternalMicrometerBreakdown(reading, "external-mm-0.01"),
    "1,00 mm + 0,23 mm",
  );
});

test("todos os 25001 valores são exatos, idempotentes e monotônicos", () => {
  let previous = -1;
  for (let ticks = 0; ticks <= EXTERNAL_MICROMETER_MAX_TICKS; ticks += 1) {
    assert.equal(snapExternalMicrometerTicks(ticks), ticks);
    assert.ok(ticks > previous);
    assert.doesNotMatch(formatExternalMicrometerReading(ticks), /NaN|Infinity/);
    previous = ticks;
  }
});

test("conversão e limites não acumulam deriva", () => {
  assert.equal(mmToExternalMicrometerTicks(12.507), 12_507);
  assert.equal(externalMicrometerTicksToMm(12_507), 12.507);
  assert.equal(snapExternalMicrometerTicks(-0.51), 0);
  assert.equal(snapExternalMicrometerTicks(25_000.51), 25_000);
  assert.equal(snapExternalMicrometerTicks(5_495, "external-mm-0.01"), 5_500);
  assert.equal(snapExternalMicrometerTicks(5_494, "external-mm-0.01"), 5_490);
  assert.throws(() => snapExternalMicrometerTicks(Number.NaN), RangeError);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIPER_SCALES,
  CALIPER_TICKS_PER_INCH,
  CALIPER_TICKS_PER_MM,
  clamp,
  convertMeasurement,
  formatCaliperReading,
  formatDecimal,
  formatDecimalTicks,
  formatFraction,
  formatFractionalInches,
  getCaliperScalesForUnit,
  inchesToTicks,
  mmToTicks,
  quantizeForScale,
  quantizeTicks,
  snapCaliperTicks,
  ticksToInches,
  ticksToMm,
} from "../lib/caliper.ts";

test("uses one exact integer model for every supported resolution", () => {
  assert.equal(CALIPER_TICKS_PER_MM, 80_000);
  assert.equal(CALIPER_TICKS_PER_INCH, 2_032_000);
  assert.equal(mmToTicks(25.4), CALIPER_TICKS_PER_INCH);
  assert.equal(inchesToTicks(1), CALIPER_TICKS_PER_INCH);

  assert.equal(CALIPER_SCALES["mm-0.1"].stepTicks, mmToTicks(0.1));
  assert.equal(CALIPER_SCALES["mm-0.05"].stepTicks, mmToTicks(0.05));
  assert.equal(CALIPER_SCALES["mm-0.02"].stepTicks, mmToTicks(0.02));
  assert.equal(
    CALIPER_SCALES["in-1/128"].stepTicks * 128,
    CALIPER_TICKS_PER_INCH,
  );
  assert.equal(
    CALIPER_SCALES["in-0.001"].stepTicks * 1_000,
    CALIPER_TICKS_PER_INCH,
  );
});

test("converts between millimetres and inches through integer ticks", () => {
  const oneInch = mmToTicks(25.4);
  assert.equal(ticksToInches(oneInch), 1);
  assert.equal(ticksToMm(oneInch), 25.4);
  assert.equal(convertMeasurement(50.8, "mm", "in"), 2);
  assert.equal(convertMeasurement(2, "in", "mm"), 50.8);
});

test("clamps values and rejects invalid ranges", () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(11, 0, 10), 10);
  assert.throws(() => clamp(1, 2, 0), /minimum/);
  assert.throws(() => clamp(Number.NaN, 0, 1), /finite/);
});

test("quantizes predictably, including midpoint and directional modes", () => {
  assert.equal(quantizeTicks(149, 100), 100);
  assert.equal(quantizeTicks(150, 100), 200);
  assert.equal(quantizeTicks(-150, 100), -200);
  assert.equal(quantizeTicks(199, 100, "floor"), 100);
  assert.equal(quantizeTicks(101, 100, "ceil"), 200);

  assert.equal(
    ticksToMm(quantizeForScale(mmToTicks(12.374), "mm-0.05")),
    12.35,
  );
  assert.equal(
    ticksToMm(quantizeForScale(mmToTicks(12.376), "mm-0.05")),
    12.4,
  );
});

test("snaps into representable scale bounds", () => {
  const maximum = mmToTicks(10.03);
  assert.equal(
    snapCaliperTicks(mmToTicks(20), "mm-0.05", 0, maximum),
    mmToTicks(10),
  );
  assert.equal(snapCaliperTicks(mmToTicks(-1), "mm-0.05"), 0);
  assert.throws(
    () => snapCaliperTicks(0, "mm-0.1", 1, 10),
    /does not contain/,
  );
});

test("formats decimal readings without binary floating-point artifacts", () => {
  assert.equal(formatDecimal(12.35, 2), "12,35");
  assert.equal(formatDecimal(12.5, 3), "12,500");
  assert.equal(
    formatDecimal(12.5, 3, { decimalSeparator: ".", trimTrailingZeros: true }),
    "12.5",
  );
  assert.equal(formatDecimalTicks(mmToTicks(12.35), "mm", 2), "12,35");
  assert.equal(formatDecimalTicks(inchesToTicks(0.125), "in", 3), "0,125");
});

test("reduces and formats fractional inch readings", () => {
  assert.equal(formatFraction(0, 128), "0");
  assert.equal(formatFraction(64, 128), "1/2");
  assert.equal(formatFraction(192, 128), "1 1/2");
  assert.equal(formatFraction(-160, 128), "-1 1/4");
  assert.equal(formatFractionalInches(inchesToTicks(1.5)), "1 1/2\u2033");
  assert.equal(
    formatFractionalInches(CALIPER_SCALES["in-1/128"].stepTicks),
    "1/128\u2033",
  );
});

test("formats each educational scale with its declared precision", () => {
  assert.equal(formatCaliperReading(mmToTicks(12.34), "mm-0.1"), "12,3 mm");
  assert.equal(formatCaliperReading(mmToTicks(12.34), "mm-0.05"), "12,35 mm");
  assert.equal(formatCaliperReading(mmToTicks(12.34), "mm-0.02"), "12,34 mm");
  assert.equal(formatCaliperReading(inchesToTicks(0.5), "in-1/128"), "1/2\u2033");
  assert.equal(formatCaliperReading(inchesToTicks(0.5), "in-0.001"), "0,500\u2033");
  assert.equal(
    formatCaliperReading(inchesToTicks(0.5), "in-0.001", {
      includeUnit: false,
      decimalSeparator: ".",
    }),
    "0.500",
  );
});

test("offers scale metadata ready for unit-specific UI controls", () => {
  assert.deepEqual(
    getCaliperScalesForUnit("mm").map((scale) => scale.id),
    ["mm-0.1", "mm-0.05", "mm-0.02"],
  );
  assert.deepEqual(
    getCaliperScalesForUnit("in").map((scale) => scale.id),
    ["in-1/128", "in-0.001"],
  );
});

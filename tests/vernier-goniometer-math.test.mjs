import assert from "node:assert/strict";
import test from "node:test";

import {
  GONIOMETER_FULL_TURN_TICKS,
  GONIOMETER_POSITION_COUNT,
  GONIOMETER_PROFILE,
  GONIOMETER_RESOLUTION_TICKS,
  decomposeVernierGoniometerReading,
  degreesToGoniometerTicks,
  formatVernierGoniometerBreakdown,
  formatVernierGoniometerReading,
  formatVernierGoniometerReadingAccessible,
  getRandomVernierGoniometerTicks,
  normalizeVernierGoniometerTicks,
  snapVernierGoniometerTicks,
  stepVernierGoniometerTicks,
} from "../lib/vernier-goniometer.ts";

const FIXTURES = [
  { ticks: 0, display: "0°00′", degrees: 0, minutes: 0, division: 0 },
  { ticks: 5, display: "0°05′", degrees: 0, minutes: 5, division: 1 },
  { ticks: 925, display: "15°25′", degrees: 15, minutes: 25, division: 5 },
  { ticks: 2_540, display: "42°20′", degrees: 42, minutes: 20, division: 4 },
  { ticks: 4_305, display: "71°45′", degrees: 71, minutes: 45, division: 9 },
  { ticks: 5_400, display: "90°00′", degrees: 90, minutes: 0, division: 0 },
  { ticks: 10_795, display: "179°55′", degrees: 179, minutes: 55, division: 11 },
  { ticks: 21_595, display: "359°55′", degrees: 359, minutes: 55, division: 11 },
];

test("perfil físico 23°/12 resolve exatamente cinco minutos", () => {
  assert.equal(GONIOMETER_FULL_TURN_TICKS, 21_600);
  assert.equal(GONIOMETER_RESOLUTION_TICKS, 5);
  assert.equal(GONIOMETER_POSITION_COUNT, 4_320);
  assert.equal(GONIOMETER_PROFILE.vernierSpanTicks, 1_380);
  assert.equal(GONIOMETER_PROFILE.vernierDivisionArcTicks, 115);
  assert.equal(2 * 60 - GONIOMETER_PROFILE.vernierDivisionArcTicks, 5);
});

test("fixtures recompõem graus, minutos, divisão e texto", () => {
  for (const fixture of FIXTURES) {
    const reading = decomposeVernierGoniometerReading(fixture.ticks);
    assert.equal(reading.degrees, fixture.degrees, fixture.display);
    assert.equal(reading.minutes, fixture.minutes, fixture.display);
    assert.equal(reading.vernierDivision, fixture.division, fixture.display);
    assert.equal(reading.degrees * 60 + reading.minutes, reading.directionalTicks);
    assert.equal(formatVernierGoniometerReading(fixture.ticks), fixture.display);
    assert.equal(
      (reading.directionalTicks + reading.vernierDivision * 115) % 60,
      0,
      `${fixture.display}: linha do nônio coincide com a escala principal`,
    );
  }
});

test("sentido anti-horário usa o lado esquerdo sem mudar o estado físico", () => {
  const clockwise = decomposeVernierGoniometerReading(17_295, "clockwise");
  const counterclockwise = decomposeVernierGoniometerReading(
    17_295,
    "counterclockwise",
  );
  assert.equal(clockwise.absoluteTicks, counterclockwise.absoluteTicks);
  assert.equal(clockwise.vernierSide, "right");
  assert.equal(counterclockwise.vernierSide, "left");
  assert.equal(formatVernierGoniometerReading(17_295, true, "counterclockwise"), "71°45′");
  assert.equal(counterclockwise.vernierDivision, 9);
});

test("normalização, snap e passos atravessam a costura sem deriva", () => {
  assert.equal(normalizeVernierGoniometerTicks(21_600), 0);
  assert.equal(normalizeVernierGoniometerTicks(-5), 21_595);
  assert.equal(snapVernierGoniometerTicks(2.5), 5);
  assert.equal(snapVernierGoniometerTicks(-2.5), 21_595);
  assert.equal(stepVernierGoniometerTicks(21_595, 1), 0);
  assert.equal(stepVernierGoniometerTicks(0, -1), 21_595);
  for (let ticks = 0; ticks < GONIOMETER_FULL_TURN_TICKS; ticks += 5) {
    assert.equal(stepVernierGoniometerTicks(stepVernierGoniometerTicks(ticks, 1), -1), ticks);
  }
});

test("todas as 4.320 posições são exatas e formatáveis", () => {
  let count = 0;
  for (let ticks = 0; ticks < GONIOMETER_FULL_TURN_TICKS; ticks += 5) {
    const reading = decomposeVernierGoniometerReading(ticks);
    assert.equal(snapVernierGoniometerTicks(ticks), ticks);
    assert.ok(reading.minutes >= 0 && reading.minutes <= 55);
    assert.equal(reading.minutes % 5, 0);
    assert.doesNotMatch(formatVernierGoniometerReading(ticks), /360°|60′|NaN/);
    count += 1;
  }
  assert.equal(count, GONIOMETER_POSITION_COUNT);
});

test("formatação didática e acessível não usa graus decimais", () => {
  const reading = decomposeVernierGoniometerReading(925);
  assert.equal(formatVernierGoniometerBreakdown(reading), "15° + 25′");
  assert.equal(formatVernierGoniometerReadingAccessible(925), "15 graus e 25 minutos");
  assert.equal(formatVernierGoniometerReadingAccessible(60), "1 grau e 0 minutos");
  assert.equal(degreesToGoniometerTicks(360), 0);
  assert.equal(degreesToGoniometerTicks(42 + 1 / 3), 2_540);
});

test("sorteio cobre extremos e rejeita RNG inválido", () => {
  assert.equal(getRandomVernierGoniometerTicks(() => 0), 0);
  assert.equal(getRandomVernierGoniometerTicks(() => 0.5), 10_800);
  assert.equal(getRandomVernierGoniometerTicks(() => 1 - Number.EPSILON), 21_595);
  assert.throws(() => getRandomVernierGoniometerTicks(() => 1), RangeError);
  assert.throws(() => getRandomVernierGoniometerTicks(() => -0.1), RangeError);
  assert.throws(() => snapVernierGoniometerTicks(Number.NaN), RangeError);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  PROTRACTOR_MAX_ARC_MINUTES,
  PROTRACTOR_MIN_ARC_MINUTES,
  PROTRACTOR_POSITION_COUNT,
  SEMICIRCULAR_PROTRACTOR_PROFILE,
  decomposeSemicircularProtractorReading,
  formatSemicircularProtractorBreakdown,
  formatSemicircularProtractorComplement,
  formatSemicircularProtractorReading,
  getRandomSemicircularProtractorArcMinutes,
  snapSemicircularProtractorArcMinutes,
  stepSemicircularProtractorArcMinutes,
} from "../lib/semicircular-protractor.ts";

test("perfil preserva a escala física de um grau e resolve cinco minutos", () => {
  assert.equal(SEMICIRCULAR_PROTRACTOR_PROFILE.rangeLabel, "5–180°");
  assert.equal(SEMICIRCULAR_PROTRACTOR_PROFILE.physicalScaleDivisionDegrees, 1);
  assert.equal(SEMICIRCULAR_PROTRACTOR_PROFILE.resolutionArcMinutes, 5);
  assert.equal(PROTRACTOR_POSITION_COUNT, 2_101);
  for (
    let minutes = PROTRACTOR_MIN_ARC_MINUTES;
    minutes <= PROTRACTOR_MAX_ARC_MINUTES;
    minutes += 5
  ) {
    assert.equal(snapSemicircularProtractorArcMinutes(minutes), minutes);
  }
});

test("leitura correspondente e complementar usam o mesmo estado exato", () => {
  assert.deepEqual(decomposeSemicircularProtractorReading(1_825), {
    totalArcMinutes: 1_825,
    degrees: 30,
    minutes: 25,
    angleDegrees: 30 + 25 / 60,
    complementaryArcMinutes: 8_975,
    complementaryDegrees: 149,
    complementaryMinutes: 35,
  });
  assert.equal(formatSemicircularProtractorReading(1_825), "30°25′");
  assert.equal(
    formatSemicircularProtractorBreakdown(1_825),
    "30°25′ correspondente · 149°35′ complementar",
  );
  assert.equal(formatSemicircularProtractorComplement(0), "0°00′");
  assert.equal(formatSemicircularProtractorComplement(10_500), "175°00′");
});

test("snap, passos, limites e sorteio permanecem em múltiplos de cinco minutos", () => {
  assert.equal(snapSemicircularProtractorArcMinutes(-2), 300);
  assert.equal(snapSemicircularProtractorArcMinutes(312), 310);
  assert.equal(snapSemicircularProtractorArcMinutes(313), 315);
  assert.equal(snapSemicircularProtractorArcMinutes(10_801), 10_800);
  assert.equal(stepSemicircularProtractorArcMinutes(10_795, 5), 10_800);
  assert.equal(getRandomSemicircularProtractorArcMinutes(() => 0), 300);
  assert.equal(
    getRandomSemicircularProtractorArcMinutes(() => 1 - Number.EPSILON),
    10_800,
  );
  assert.throws(
    () => getRandomSemicircularProtractorArcMinutes(() => 1),
    RangeError,
  );
});

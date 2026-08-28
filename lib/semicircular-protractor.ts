/** Exact integer arc-minute model for the didactic 5–180° protractor. */

export const PROTRACTOR_MINUTES_PER_DEGREE = 60;
export const PROTRACTOR_MIN_READING_DEGREES = 5;
export const PROTRACTOR_SWEEP_DEGREES = 180;
export const PROTRACTOR_MIN_ARC_MINUTES =
  PROTRACTOR_MIN_READING_DEGREES * PROTRACTOR_MINUTES_PER_DEGREE;
export const PROTRACTOR_MAX_ARC_MINUTES =
  PROTRACTOR_SWEEP_DEGREES * PROTRACTOR_MINUTES_PER_DEGREE;
export const PROTRACTOR_SWEEP_ARC_MINUTES =
  PROTRACTOR_MAX_ARC_MINUTES - PROTRACTOR_MIN_ARC_MINUTES;
export const PROTRACTOR_RESOLUTION_ARC_MINUTES = 5;
export const PROTRACTOR_POSITION_COUNT =
  PROTRACTOR_SWEEP_ARC_MINUTES / PROTRACTOR_RESOLUTION_ARC_MINUTES + 1;

export const SEMICIRCULAR_PROTRACTOR_PROFILE = {
  id: "semicircular-5-180-5min",
  label: "5′",
  rangeLabel: "5–180°",
  minArcMinutes: PROTRACTOR_MIN_ARC_MINUTES,
  maxArcMinutes: PROTRACTOR_MAX_ARC_MINUTES,
  physicalScaleDivisionDegrees: 1,
  resolutionArcMinutes: PROTRACTOR_RESOLUTION_ARC_MINUTES,
} as const;

export interface SemicircularProtractorReading {
  readonly totalArcMinutes: number;
  readonly degrees: number;
  readonly minutes: number;
  readonly angleDegrees: number;
  readonly complementaryArcMinutes: number;
  readonly complementaryDegrees: number;
  readonly complementaryMinutes: number;
}

function assertFinite(value: number, name: string) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function splitArcMinutes(totalArcMinutes: number) {
  return {
    degrees: Math.floor(totalArcMinutes / PROTRACTOR_MINUTES_PER_DEGREE),
    minutes: totalArcMinutes % PROTRACTOR_MINUTES_PER_DEGREE,
  };
}

function formatArcMinutes(totalArcMinutes: number) {
  const parts = splitArcMinutes(totalArcMinutes);
  return `${parts.degrees}°${String(parts.minutes).padStart(2, "0")}′`;
}

export function snapSemicircularProtractorArcMinutes(candidate: number): number {
  assertFinite(candidate, "candidate");
  const snapped =
    Math.round(candidate / PROTRACTOR_RESOLUTION_ARC_MINUTES) *
    PROTRACTOR_RESOLUTION_ARC_MINUTES;
  return Math.max(
    PROTRACTOR_MIN_ARC_MINUTES,
    Math.min(PROTRACTOR_MAX_ARC_MINUTES, snapped),
  );
}

export function stepSemicircularProtractorArcMinutes(
  arcMinutes: number,
  deltaSteps: number,
): number {
  assertFinite(arcMinutes, "arcMinutes");
  assertFinite(deltaSteps, "deltaSteps");
  if (!Number.isSafeInteger(deltaSteps)) {
    throw new RangeError("deltaSteps must be a safe integer");
  }
  return snapSemicircularProtractorArcMinutes(
    arcMinutes + deltaSteps * PROTRACTOR_RESOLUTION_ARC_MINUTES,
  );
}

export function decomposeSemicircularProtractorReading(
  arcMinutes: number,
): SemicircularProtractorReading {
  const snapped = snapSemicircularProtractorArcMinutes(arcMinutes);
  const corresponding = splitArcMinutes(snapped);
  const complementaryArcMinutes = PROTRACTOR_MAX_ARC_MINUTES - snapped;
  const complementary = splitArcMinutes(complementaryArcMinutes);
  return {
    totalArcMinutes: snapped,
    ...corresponding,
    angleDegrees: snapped / PROTRACTOR_MINUTES_PER_DEGREE,
    complementaryArcMinutes,
    complementaryDegrees: complementary.degrees,
    complementaryMinutes: complementary.minutes,
  };
}

export function formatSemicircularProtractorReading(arcMinutes: number): string {
  const reading = decomposeSemicircularProtractorReading(arcMinutes);
  return formatArcMinutes(reading.totalArcMinutes);
}

export function formatSemicircularProtractorComplement(
  arcMinutes: number,
): string {
  assertFinite(arcMinutes, "arcMinutes");
  const snapped =
    Math.round(arcMinutes / PROTRACTOR_RESOLUTION_ARC_MINUTES) *
    PROTRACTOR_RESOLUTION_ARC_MINUTES;
  return formatArcMinutes(
    Math.max(0, Math.min(PROTRACTOR_SWEEP_ARC_MINUTES, snapped)),
  );
}

export function formatSemicircularProtractorBreakdown(
  arcMinutes: number,
): string {
  const reading = decomposeSemicircularProtractorReading(arcMinutes);
  return `${formatSemicircularProtractorReading(reading.totalArcMinutes)} correspondente · ${formatSemicircularProtractorComplement(reading.complementaryArcMinutes)} complementar`;
}

export function formatSemicircularProtractorReadingAccessible(
  arcMinutes: number,
): string {
  const reading = decomposeSemicircularProtractorReading(arcMinutes);
  return `${reading.degrees} graus e ${reading.minutes} minutos; ângulo complementar de ${reading.complementaryDegrees} graus e ${reading.complementaryMinutes} minutos`;
}

export function getRandomSemicircularProtractorArcMinutes(
  random = Math.random,
): number {
  const value = random();
  assertFinite(value, "random value");
  if (value < 0 || value >= 1) {
    throw new RangeError("random must return a value in [0, 1)");
  }
  return (
    PROTRACTOR_MIN_ARC_MINUTES +
    Math.floor(value * PROTRACTOR_POSITION_COUNT) *
      PROTRACTOR_RESOLUTION_ARC_MINUTES
  );
}

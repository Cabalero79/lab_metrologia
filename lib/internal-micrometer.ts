/**
 * Deterministic domain model for the two-point caliper-type internal micrometer.
 *
 * One tick is exactly 0.01 mm, matching the only profile in the first
 * micrometer release. Pixels, angles and accumulated floating-point deltas are
 * presentation details and never become measurement state.
 */

export const INTERNAL_MICROMETER_TICKS_PER_MM = 100;
export const INTERNAL_MICROMETER_MIN_TICKS = 500;
export const INTERNAL_MICROMETER_MAX_TICKS = 1_500;
export const INTERNAL_MICROMETER_RESOLUTION_TICKS = 1;
export const INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS = 50;
export const INTERNAL_MICROMETER_THIMBLE_DIVISIONS = 50;

export const INTERNAL_MICROMETER_PROFILE = {
  id: "internal-mm-0.01",
  label: "0,01 mm",
  unit: "mm",
  rangeLabel: "5–15 mm",
  minTicks: INTERNAL_MICROMETER_MIN_TICKS,
  maxTicks: INTERNAL_MICROMETER_MAX_TICKS,
  resolutionTicks: INTERNAL_MICROMETER_RESOLUTION_TICKS,
  spindlePitchTicks: INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  thimbleDivisions: INTERNAL_MICROMETER_THIMBLE_DIVISIONS,
  decimalPlaces: 2,
} as const;

export interface InternalMicrometerReading {
  readonly totalTicks: number;
  readonly sleeveTicks: number;
  readonly wholeMillimetreTicks: number;
  readonly halfMillimetreTicks: number;
  readonly thimbleTicks: number;
  readonly thimbleDivision: number;
  readonly turnsFromMinimum: number;
  readonly phaseTicks: number;
  readonly thimbleAngleDegrees: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`);
  }
}

function assertSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function mmToInternalMicrometerTicks(millimetres: number): number {
  assertFinite(millimetres, "millimetres");
  const ticks = roundHalfAwayFromZero(
    millimetres * INTERNAL_MICROMETER_TICKS_PER_MM,
  );
  assertSafeInteger(ticks, "converted ticks");
  return ticks;
}

export function internalMicrometerTicksToMm(ticks: number): number {
  assertSafeInteger(ticks, "ticks");
  return ticks / INTERNAL_MICROMETER_TICKS_PER_MM;
}

export function snapInternalMicrometerTicks(candidateTicks: number): number {
  assertFinite(candidateTicks, "candidateTicks");
  const quantized = roundHalfAwayFromZero(candidateTicks);
  return Math.min(
    INTERNAL_MICROMETER_MAX_TICKS,
    Math.max(INTERNAL_MICROMETER_MIN_TICKS, quantized),
  );
}

export function stepInternalMicrometerTicks(
  ticks: number,
  deltaSteps: number,
): number {
  assertSafeInteger(ticks, "ticks");
  assertSafeInteger(deltaSteps, "deltaSteps");
  return snapInternalMicrometerTicks(
    ticks + deltaSteps * INTERNAL_MICROMETER_RESOLUTION_TICKS,
  );
}

export function decomposeInternalMicrometerReading(
  ticks: number,
): InternalMicrometerReading {
  const totalTicks = snapInternalMicrometerTicks(ticks);
  const phaseTicks = positiveModulo(
    totalTicks - INTERNAL_MICROMETER_MIN_TICKS,
    INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  );
  const sleeveTicks = totalTicks - phaseTicks;
  const wholeMillimetreTicks =
    Math.floor(sleeveTicks / INTERNAL_MICROMETER_TICKS_PER_MM) *
    INTERNAL_MICROMETER_TICKS_PER_MM;
  const halfMillimetreTicks = sleeveTicks - wholeMillimetreTicks;

  return {
    totalTicks,
    sleeveTicks,
    wholeMillimetreTicks,
    halfMillimetreTicks,
    thimbleTicks: phaseTicks,
    thimbleDivision: phaseTicks / INTERNAL_MICROMETER_RESOLUTION_TICKS,
    turnsFromMinimum:
      (totalTicks - INTERNAL_MICROMETER_MIN_TICKS) /
      INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    phaseTicks,
    thimbleAngleDegrees:
      (phaseTicks * 360) / INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  };
}

function formatTicks(ticks: number): string {
  assertSafeInteger(ticks, "ticks");
  const sign = ticks < 0 ? "-" : "";
  const absoluteTicks = Math.abs(ticks);
  const whole = Math.floor(absoluteTicks / INTERNAL_MICROMETER_TICKS_PER_MM);
  const fraction = String(
    absoluteTicks % INTERNAL_MICROMETER_TICKS_PER_MM,
  ).padStart(2, "0");
  return `${sign}${whole},${fraction}`;
}

export function formatInternalMicrometerReading(
  ticks: number,
  includeUnit = true,
): string {
  const snapped = snapInternalMicrometerTicks(ticks);
  return `${formatTicks(snapped)}${includeUnit ? " mm" : ""}`;
}

export function formatInternalMicrometerBreakdown(
  reading: InternalMicrometerReading,
): string {
  return `${formatTicks(reading.sleeveTicks)} mm + ${formatTicks(reading.thimbleTicks)} mm`;
}

export function formatInternalMicrometerInches(ticks: number): string {
  const snapped = snapInternalMicrometerTicks(ticks);
  const inches = internalMicrometerTicksToMm(snapped) / 25.4;
  return `${inches.toFixed(4).replace(".", ",")}″`;
}

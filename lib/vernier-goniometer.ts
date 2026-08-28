/**
 * Exact angular model for the 0–360° universal vernier protractor.
 *
 * One tick is exactly one minute of arc. The selectable resolution is 5′ and
 * 360°00′ is represented by the same canonical state as 0°00′.
 */

export const GONIOMETER_MINUTES_PER_DEGREE = 60;
export const GONIOMETER_FULL_TURN_TICKS = 360 * GONIOMETER_MINUTES_PER_DEGREE;
export const GONIOMETER_RESOLUTION_TICKS = 5;
export const GONIOMETER_POSITION_COUNT =
  GONIOMETER_FULL_TURN_TICKS / GONIOMETER_RESOLUTION_TICKS;
export const GONIOMETER_VERNIER_DIVISIONS_PER_SIDE = 12;
export const GONIOMETER_VERNIER_SPAN_DEGREES = 23;

export type GoniometerDirection = "clockwise" | "counterclockwise";
export type GoniometerVernierSide = "right" | "left";

export const GONIOMETER_PROFILE = {
  id: "universal-deg-5min",
  label: "5′",
  rangeLabel: "0–360°",
  fullTurnTicks: GONIOMETER_FULL_TURN_TICKS,
  resolutionTicks: GONIOMETER_RESOLUTION_TICKS,
  mainScaleDivisionTicks: GONIOMETER_MINUTES_PER_DEGREE,
  vernierDivisionsPerSide: GONIOMETER_VERNIER_DIVISIONS_PER_SIDE,
  vernierSpanTicks:
    GONIOMETER_VERNIER_SPAN_DEGREES * GONIOMETER_MINUTES_PER_DEGREE,
  vernierDivisionArcTicks: 115,
  comparedMainDivisions: 2,
} as const;

export interface VernierGoniometerReading {
  readonly totalTicks: number;
  readonly absoluteTicks: number;
  readonly directionalTicks: number;
  readonly direction: GoniometerDirection;
  readonly vernierSide: GoniometerVernierSide;
  readonly degrees: number;
  readonly minutes: number;
  readonly vernierDivision: number;
  readonly angleDegrees: number;
  readonly mainScaleTicks: number;
  readonly coincidentMainScaleTicks: number;
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

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

export function degreesToGoniometerTicks(degrees: number): number {
  assertFinite(degrees, "degrees");
  return snapVernierGoniometerTicks(degrees * GONIOMETER_MINUTES_PER_DEGREE);
}

export function goniometerTicksToDegrees(ticks: number): number {
  assertSafeInteger(ticks, "ticks");
  return normalizeVernierGoniometerTicks(ticks) / GONIOMETER_MINUTES_PER_DEGREE;
}

export function normalizeVernierGoniometerTicks(ticks: number): number {
  assertSafeInteger(ticks, "ticks");
  return positiveModulo(ticks, GONIOMETER_FULL_TURN_TICKS);
}

export function snapVernierGoniometerTicks(candidateTicks: number): number {
  assertFinite(candidateTicks, "candidateTicks");
  const quantized =
    roundHalfAwayFromZero(candidateTicks / GONIOMETER_RESOLUTION_TICKS) *
    GONIOMETER_RESOLUTION_TICKS;
  if (!Number.isSafeInteger(quantized)) {
    throw new RangeError("quantized ticks must be a safe integer");
  }
  return normalizeVernierGoniometerTicks(quantized);
}

export function stepVernierGoniometerTicks(
  ticks: number,
  deltaSteps: number,
): number {
  assertSafeInteger(ticks, "ticks");
  assertSafeInteger(deltaSteps, "deltaSteps");
  return snapVernierGoniometerTicks(
    ticks + deltaSteps * GONIOMETER_RESOLUTION_TICKS,
  );
}

export function decomposeVernierGoniometerReading(
  ticks: number,
  direction: GoniometerDirection = "clockwise",
): VernierGoniometerReading {
  const absoluteTicks = snapVernierGoniometerTicks(ticks);
  const directionalTicks = normalizeVernierGoniometerTicks(
    direction === "clockwise" ? absoluteTicks : -absoluteTicks,
  );
  const degrees = Math.floor(directionalTicks / GONIOMETER_MINUTES_PER_DEGREE);
  const minutes = directionalTicks % GONIOMETER_MINUTES_PER_DEGREE;
  const vernierDivision = minutes / GONIOMETER_RESOLUTION_TICKS;
  const mainScaleTicks = degrees * GONIOMETER_MINUTES_PER_DEGREE;
  const coincidentDirectionalTicks = normalizeVernierGoniometerTicks(
    mainScaleTicks + vernierDivision * 2 * GONIOMETER_MINUTES_PER_DEGREE,
  );
  return {
    totalTicks: absoluteTicks,
    absoluteTicks,
    directionalTicks,
    direction,
    vernierSide: direction === "clockwise" ? "right" : "left",
    degrees,
    minutes,
    vernierDivision,
    angleDegrees: absoluteTicks / GONIOMETER_MINUTES_PER_DEGREE,
    mainScaleTicks,
    coincidentMainScaleTicks: normalizeVernierGoniometerTicks(
      direction === "clockwise"
        ? coincidentDirectionalTicks
        : -coincidentDirectionalTicks,
    ),
  };
}

export function formatVernierGoniometerReading(
  ticks: number,
  includeUnit = true,
  direction: GoniometerDirection = "clockwise",
): string {
  const reading = decomposeVernierGoniometerReading(ticks, direction);
  const value = `${reading.degrees}°${String(reading.minutes).padStart(2, "0")}′`;
  return includeUnit ? `${value}` : value;
}

export function formatVernierGoniometerBreakdown(
  reading: VernierGoniometerReading,
): string {
  return `${reading.degrees}° + ${reading.minutes}′`;
}

export function formatVernierGoniometerReadingAccessible(
  ticks: number,
  direction: GoniometerDirection = "clockwise",
): string {
  const reading = decomposeVernierGoniometerReading(ticks, direction);
  const degreeLabel = reading.degrees === 1 ? "grau" : "graus";
  const minuteLabel = reading.minutes === 1 ? "minuto" : "minutos";
  return `${reading.degrees} ${degreeLabel} e ${reading.minutes} ${minuteLabel}`;
}

export function getRandomVernierGoniometerTicks(random = Math.random): number {
  const value = random();
  assertFinite(value, "random value");
  if (value < 0 || value >= 1) {
    throw new RangeError("random must return a value in [0, 1)");
  }
  return Math.floor(value * GONIOMETER_POSITION_COUNT) * GONIOMETER_RESOLUTION_TICKS;
}

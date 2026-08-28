/**
 * Exact model for the 0–25 mm vernier outside micrometer.
 *
 * One tick is exactly 0.001 mm. Pixel positions and accumulated floating-point
 * deltas never become measurement state.
 */

export const EXTERNAL_MICROMETER_TICKS_PER_MM = 1_000;
export const EXTERNAL_MICROMETER_MIN_TICKS = 0;
export const EXTERNAL_MICROMETER_MAX_TICKS = 25_000;
export const EXTERNAL_MICROMETER_RESOLUTION_TICKS = 1;
export const EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS = 500;
export const EXTERNAL_MICROMETER_THIMBLE_DIVISIONS = 50;
export const EXTERNAL_MICROMETER_VERNIER_DIVISIONS = 10;

export const EXTERNAL_MICROMETER_PROFILES = {
  "external-mm-0.01": {
    id: "external-mm-0.01",
    label: "0,01 mm",
    shortLabel: "0,01",
    description: "centesimal",
    unit: "mm",
    rangeLabel: "0–25 mm",
    minTicks: EXTERNAL_MICROMETER_MIN_TICKS,
    maxTicks: EXTERNAL_MICROMETER_MAX_TICKS,
    resolutionTicks: 10,
    spindlePitchTicks: EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    thimbleDivisions: EXTERNAL_MICROMETER_THIMBLE_DIVISIONS,
    vernierDivisions: 0,
    decimalPlaces: 2,
  },
  "external-mm-0.001": {
    id: "external-mm-0.001",
    label: "0,001 mm",
    shortLabel: "0,001",
    description: "milesimal",
    unit: "mm",
    rangeLabel: "0–25 mm",
    minTicks: EXTERNAL_MICROMETER_MIN_TICKS,
    maxTicks: EXTERNAL_MICROMETER_MAX_TICKS,
    resolutionTicks: EXTERNAL_MICROMETER_RESOLUTION_TICKS,
    spindlePitchTicks: EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    thimbleDivisions: EXTERNAL_MICROMETER_THIMBLE_DIVISIONS,
    vernierDivisions: EXTERNAL_MICROMETER_VERNIER_DIVISIONS,
    decimalPlaces: 3,
  },
} as const;

export type ExternalMicrometerProfileId =
  keyof typeof EXTERNAL_MICROMETER_PROFILES;

export const EXTERNAL_MICROMETER_PROFILE_IDS = [
  "external-mm-0.01",
  "external-mm-0.001",
] as const satisfies readonly ExternalMicrometerProfileId[];

export const DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID =
  "external-mm-0.001" satisfies ExternalMicrometerProfileId;

export const EXTERNAL_MICROMETER_PROFILE =
  EXTERNAL_MICROMETER_PROFILES[DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID];

export interface ExternalMicrometerReading {
  readonly totalTicks: number;
  readonly sleeveTicks: number;
  readonly wholeMillimetreTicks: number;
  readonly halfMillimetreTicks: number;
  readonly thimbleTicks: number;
  readonly thimbleDivision: number;
  readonly vernierTicks: number;
  readonly vernierDivision: number;
  readonly phaseTicks: number;
  readonly turnsFromZero: number;
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

export function mmToExternalMicrometerTicks(millimetres: number): number {
  assertFinite(millimetres, "millimetres");
  const ticks = roundHalfAwayFromZero(
    millimetres * EXTERNAL_MICROMETER_TICKS_PER_MM,
  );
  assertSafeInteger(ticks, "converted ticks");
  return ticks;
}

export function externalMicrometerTicksToMm(ticks: number): number {
  assertSafeInteger(ticks, "ticks");
  return ticks / EXTERNAL_MICROMETER_TICKS_PER_MM;
}

export function snapExternalMicrometerTicks(
  candidateTicks: number,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): number {
  assertFinite(candidateTicks, "candidateTicks");
  const resolutionTicks =
    EXTERNAL_MICROMETER_PROFILES[profileId].resolutionTicks;
  const quantized =
    roundHalfAwayFromZero(candidateTicks / resolutionTicks) * resolutionTicks;
  return Math.min(
    EXTERNAL_MICROMETER_MAX_TICKS,
    Math.max(EXTERNAL_MICROMETER_MIN_TICKS, quantized),
  );
}

export function stepExternalMicrometerTicks(
  ticks: number,
  deltaSteps: number,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): number {
  assertSafeInteger(ticks, "ticks");
  assertSafeInteger(deltaSteps, "deltaSteps");
  const resolutionTicks =
    EXTERNAL_MICROMETER_PROFILES[profileId].resolutionTicks;
  return snapExternalMicrometerTicks(
    ticks + deltaSteps * resolutionTicks,
    profileId,
  );
}

export function decomposeExternalMicrometerReading(
  ticks: number,
): ExternalMicrometerReading {
  const totalTicks = snapExternalMicrometerTicks(ticks);
  const phaseTicks = positiveModulo(
    totalTicks,
    EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  );
  const sleeveTicks = totalTicks - phaseTicks;
  const wholeMillimetreTicks =
    Math.floor(sleeveTicks / EXTERNAL_MICROMETER_TICKS_PER_MM) *
    EXTERNAL_MICROMETER_TICKS_PER_MM;
  const halfMillimetreTicks = sleeveTicks - wholeMillimetreTicks;
  const thimbleTicks =
    Math.floor(phaseTicks / EXTERNAL_MICROMETER_VERNIER_DIVISIONS) *
    EXTERNAL_MICROMETER_VERNIER_DIVISIONS;
  const vernierTicks = phaseTicks - thimbleTicks;

  return {
    totalTicks,
    sleeveTicks,
    wholeMillimetreTicks,
    halfMillimetreTicks,
    thimbleTicks,
    thimbleDivision:
      thimbleTicks / EXTERNAL_MICROMETER_VERNIER_DIVISIONS,
    vernierTicks,
    vernierDivision: vernierTicks,
    phaseTicks,
    turnsFromZero: totalTicks / EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    thimbleAngleDegrees:
      (phaseTicks * 360) / EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  };
}

function formatTicks(ticks: number, decimalPlaces: 2 | 3): string {
  assertSafeInteger(ticks, "ticks");
  const whole = Math.floor(ticks / EXTERNAL_MICROMETER_TICKS_PER_MM);
  const tickScale = 10 ** (3 - decimalPlaces);
  const fraction = String(
    Math.floor((ticks % EXTERNAL_MICROMETER_TICKS_PER_MM) / tickScale),
  ).padStart(decimalPlaces, "0");
  return `${whole},${fraction}`;
}

export function formatExternalMicrometerReading(
  ticks: number,
  includeUnit = true,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): string {
  const profile = EXTERNAL_MICROMETER_PROFILES[profileId];
  const snapped = snapExternalMicrometerTicks(ticks, profileId);
  return `${formatTicks(snapped, profile.decimalPlaces)}${includeUnit ? " mm" : ""}`;
}

export function formatExternalMicrometerBreakdown(
  reading: ExternalMicrometerReading,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): string {
  const profile = EXTERNAL_MICROMETER_PROFILES[profileId];
  if (profile.vernierDivisions === 0) {
    return `${formatTicks(reading.sleeveTicks, 2)} mm + ${formatTicks(reading.thimbleTicks, 2)} mm`;
  }
  return `${formatTicks(reading.sleeveTicks, 3)} mm + ${formatTicks(reading.thimbleTicks, 3)} mm + ${formatTicks(reading.vernierTicks, 3)} mm`;
}

export function formatExternalMicrometerInches(
  ticks: number,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): string {
  const snapped = snapExternalMicrometerTicks(ticks, profileId);
  const inches = externalMicrometerTicksToMm(snapped) / 25.4;
  return `${inches.toFixed(5).replace(".", ",")}″`;
}

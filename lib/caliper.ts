/**
 * Deterministic measurement model for the virtual universal caliper.
 *
 * A tick is 1 / 80,000 mm. This denominator is the least common multiple
 * needed to represent every supported resolution exactly:
 *
 * - 0.1, 0.05 and 0.02 mm
 * - 1/128 inch
 * - 0.001 inch
 *
 * Keeping the instrument state in ticks prevents floating-point drift while
 * dragging, stepping with the keyboard, changing units or formatting a value.
 */

export const CALIPER_TICKS_PER_MM = 80_000;
export const CALIPER_TICKS_PER_INCH = 2_032_000;
export const DEFAULT_CALIPER_RANGE_MM = 150;
export const DEFAULT_CALIPER_MAX_TICKS =
  DEFAULT_CALIPER_RANGE_MM * CALIPER_TICKS_PER_MM;

export type MeasurementUnit = "mm" | "in";
export type QuantizeMode = "nearest" | "floor" | "ceil";
export type CaliperScaleId =
  | "mm-0.1"
  | "mm-0.05"
  | "mm-0.02"
  | "in-1/128"
  | "in-0.001";

export interface ExactFraction {
  readonly numerator: number;
  readonly denominator: number;
}

export interface CaliperScale {
  readonly id: CaliperScaleId;
  readonly label: string;
  readonly unit: MeasurementUnit;
  readonly format: "decimal" | "fraction";
  readonly resolution: ExactFraction;
  readonly stepTicks: number;
  readonly mainScaleDivision: ExactFraction;
  readonly vernierDivisions: number;
  readonly decimalPlaces?: number;
  readonly fractionDenominator?: number;
}

export const CALIPER_SCALES = {
  "mm-0.1": {
    id: "mm-0.1",
    label: "0,1 mm",
    unit: "mm",
    format: "decimal",
    resolution: { numerator: 1, denominator: 10 },
    stepTicks: 8_000,
    mainScaleDivision: { numerator: 1, denominator: 1 },
    vernierDivisions: 10,
    decimalPlaces: 1,
  },
  "mm-0.05": {
    id: "mm-0.05",
    label: "0,05 mm",
    unit: "mm",
    format: "decimal",
    resolution: { numerator: 1, denominator: 20 },
    stepTicks: 4_000,
    mainScaleDivision: { numerator: 1, denominator: 1 },
    vernierDivisions: 20,
    decimalPlaces: 2,
  },
  "mm-0.02": {
    id: "mm-0.02",
    label: "0,02 mm",
    unit: "mm",
    format: "decimal",
    resolution: { numerator: 1, denominator: 50 },
    stepTicks: 1_600,
    mainScaleDivision: { numerator: 1, denominator: 1 },
    vernierDivisions: 50,
    decimalPlaces: 2,
  },
  "in-1/128": {
    id: "in-1/128",
    label: "1/128\u2033",
    unit: "in",
    format: "fraction",
    resolution: { numerator: 1, denominator: 128 },
    stepTicks: 15_875,
    mainScaleDivision: { numerator: 1, denominator: 16 },
    vernierDivisions: 8,
    fractionDenominator: 128,
  },
  "in-0.001": {
    id: "in-0.001",
    label: "0,001\u2033",
    unit: "in",
    format: "decimal",
    resolution: { numerator: 1, denominator: 1_000 },
    stepTicks: 2_032,
    mainScaleDivision: { numerator: 1, denominator: 40 },
    vernierDivisions: 25,
    decimalPlaces: 3,
  },
} as const satisfies Record<CaliperScaleId, CaliperScale>;

export const CALIPER_SCALE_LIST: readonly CaliperScale[] = Object.values(
  CALIPER_SCALES,
);

export interface DecimalFormatOptions {
  readonly decimalSeparator?: "," | ".";
  readonly trimTrailingZeros?: boolean;
}

export interface ReadingFormatOptions extends DecimalFormatOptions {
  readonly includeUnit?: boolean;
  /** Format the supplied value without first snapping it to the selected scale. */
  readonly quantize?: boolean;
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

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  assertFinite(value, "value");
  assertFinite(minimum, "minimum");
  assertFinite(maximum, "maximum");

  if (minimum > maximum) {
    throw new RangeError("minimum must be less than or equal to maximum");
  }

  return Math.min(maximum, Math.max(minimum, value));
}

export function getCaliperScale(scaleId: CaliperScaleId): CaliperScale {
  return CALIPER_SCALES[scaleId];
}

export function getCaliperScalesForUnit(
  unit: MeasurementUnit,
): readonly CaliperScale[] {
  return CALIPER_SCALE_LIST.filter((scale) => scale.unit === unit);
}

export function measurementToTicks(
  value: number,
  unit: MeasurementUnit,
): number {
  assertFinite(value, "value");
  const ticksPerUnit =
    unit === "mm" ? CALIPER_TICKS_PER_MM : CALIPER_TICKS_PER_INCH;
  const ticks = roundHalfAwayFromZero(value * ticksPerUnit);
  assertSafeInteger(ticks, "converted ticks");
  return ticks;
}

export function mmToTicks(millimetres: number): number {
  return measurementToTicks(millimetres, "mm");
}

export function inchesToTicks(inches: number): number {
  return measurementToTicks(inches, "in");
}

export function ticksToMeasurement(
  ticks: number,
  unit: MeasurementUnit,
): number {
  assertSafeInteger(ticks, "ticks");
  const ticksPerUnit =
    unit === "mm" ? CALIPER_TICKS_PER_MM : CALIPER_TICKS_PER_INCH;
  return ticks / ticksPerUnit;
}

export function ticksToMm(ticks: number): number {
  return ticksToMeasurement(ticks, "mm");
}

export function ticksToInches(ticks: number): number {
  return ticksToMeasurement(ticks, "in");
}

export function convertMeasurement(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to) {
    assertFinite(value, "value");
    return value;
  }

  return ticksToMeasurement(measurementToTicks(value, from), to);
}

export function quantizeTicks(
  ticks: number,
  stepTicks: number,
  mode: QuantizeMode = "nearest",
  originTicks = 0,
): number {
  assertFinite(ticks, "ticks");
  assertSafeInteger(stepTicks, "stepTicks");
  assertSafeInteger(originTicks, "originTicks");

  if (stepTicks <= 0) {
    throw new RangeError("stepTicks must be greater than zero");
  }

  const relativeStep = (ticks - originTicks) / stepTicks;
  let stepIndex: number;

  if (mode === "floor") {
    stepIndex = Math.floor(relativeStep);
  } else if (mode === "ceil") {
    stepIndex = Math.ceil(relativeStep);
  } else {
    stepIndex = roundHalfAwayFromZero(relativeStep);
  }

  const quantized = originTicks + stepIndex * stepTicks;
  assertSafeInteger(quantized, "quantized ticks");
  return quantized;
}

export function quantizeForScale(
  ticks: number,
  scale: CaliperScale | CaliperScaleId,
  mode: QuantizeMode = "nearest",
): number {
  const resolvedScale =
    typeof scale === "string" ? getCaliperScale(scale) : scale;
  return quantizeTicks(ticks, resolvedScale.stepTicks, mode);
}

/**
 * Clamp an arbitrary pointer-derived position to the valid, representable
 * readings for a scale. Bounds do not need to be aligned to the resolution.
 */
export function snapCaliperTicks(
  ticks: number,
  scale: CaliperScale | CaliperScaleId,
  minimumTicks = 0,
  maximumTicks = DEFAULT_CALIPER_MAX_TICKS,
): number {
  assertSafeInteger(minimumTicks, "minimumTicks");
  assertSafeInteger(maximumTicks, "maximumTicks");

  if (minimumTicks > maximumTicks) {
    throw new RangeError("minimumTicks must be less than or equal to maximumTicks");
  }

  const resolvedScale =
    typeof scale === "string" ? getCaliperScale(scale) : scale;
  const lowerReading = quantizeTicks(
    minimumTicks,
    resolvedScale.stepTicks,
    "ceil",
  );
  const upperReading = quantizeTicks(
    maximumTicks,
    resolvedScale.stepTicks,
    "floor",
  );

  if (lowerReading > upperReading) {
    throw new RangeError("range does not contain a reading for this scale");
  }

  return clamp(
    quantizeForScale(ticks, resolvedScale),
    lowerReading,
    upperReading,
  );
}

export function formatDecimal(
  value: number,
  fractionDigits: number,
  options: DecimalFormatOptions = {},
): string {
  assertFinite(value, "value");
  assertSafeInteger(fractionDigits, "fractionDigits");

  if (fractionDigits < 0 || fractionDigits > 9) {
    throw new RangeError("fractionDigits must be between zero and nine");
  }

  const factor = 10 ** fractionDigits;
  const scaledValue = roundHalfAwayFromZero(value * factor);
  assertSafeInteger(scaledValue, "formatted value");
  return formatScaledInteger(scaledValue, fractionDigits, options);
}

function formatScaledInteger(
  scaledValue: number,
  fractionDigits: number,
  options: DecimalFormatOptions,
): string {
  const decimalSeparator = options.decimalSeparator ?? ",";
  const isNegative = scaledValue < 0;
  const absoluteValue = Math.abs(scaledValue);
  const factor = 10 ** fractionDigits;
  const whole = Math.floor(absoluteValue / factor);
  let fraction = String(absoluteValue % factor).padStart(fractionDigits, "0");

  if (options.trimTrailingZeros) {
    fraction = fraction.replace(/0+$/, "");
  }

  const sign = isNegative ? "-" : "";
  return fraction.length > 0
    ? `${sign}${whole}${decimalSeparator}${fraction}`
    : `${sign}${whole}`;
}

export function formatDecimalTicks(
  ticks: number,
  unit: MeasurementUnit,
  fractionDigits: number,
  options: DecimalFormatOptions = {},
): string {
  assertSafeInteger(ticks, "ticks");
  assertSafeInteger(fractionDigits, "fractionDigits");

  if (fractionDigits < 0 || fractionDigits > 9) {
    throw new RangeError("fractionDigits must be between zero and nine");
  }

  const ticksPerUnit =
    unit === "mm" ? CALIPER_TICKS_PER_MM : CALIPER_TICKS_PER_INCH;
  const decimalFactor = 10 ** fractionDigits;
  const sign = ticks < 0 ? -1 : 1;
  const absoluteTicks = Math.abs(ticks);
  const wholeUnits = Math.floor(absoluteTicks / ticksPerUnit);
  const remainderTicks = absoluteTicks % ticksPerUnit;
  const roundedFraction = roundHalfAwayFromZero(
    (remainderTicks * decimalFactor) / ticksPerUnit,
  );
  const scaledValue = sign * (wholeUnits * decimalFactor + roundedFraction);
  assertSafeInteger(scaledValue, "formatted value");
  return formatScaledInteger(scaledValue, fractionDigits, options);
}

/**
 * Format the exact current reading in the unit opposite to the active scale.
 * The display uses conventional teaching precision without changing or
 * re-quantizing the instrument state.
 */
export function formatOppositeUnitReading(
  ticks: number,
  sourceUnit: MeasurementUnit,
): string {
  assertSafeInteger(ticks, "ticks");

  return sourceUnit === "mm"
    ? `${formatDecimalTicks(ticks, "in", 4)}\u2033`
    : `${formatDecimalTicks(ticks, "mm", 3)} mm`;
}

/** Format a signed improper fraction as a reduced whole/mixed fraction. */
export function formatFraction(
  numerator: number,
  denominator: number,
): string {
  assertSafeInteger(numerator, "numerator");
  assertSafeInteger(denominator, "denominator");

  if (denominator <= 0) {
    throw new RangeError("denominator must be greater than zero");
  }

  if (numerator === 0) {
    return "0";
  }

  const sign = numerator < 0 ? "-" : "";
  const absoluteNumerator = Math.abs(numerator);
  const whole = Math.floor(absoluteNumerator / denominator);
  const remainder = absoluteNumerator % denominator;

  if (remainder === 0) {
    return `${sign}${whole}`;
  }

  const divisor = greatestCommonDivisor(remainder, denominator);
  const fraction = `${remainder / divisor}/${denominator / divisor}`;
  return whole > 0 ? `${sign}${whole} ${fraction}` : `${sign}${fraction}`;
}

export function formatFractionalInches(
  ticks: number,
  denominator = 128,
  includeUnit = true,
): string {
  assertSafeInteger(ticks, "ticks");
  assertSafeInteger(denominator, "denominator");

  if (denominator <= 0 || CALIPER_TICKS_PER_INCH % denominator !== 0) {
    throw new RangeError(
      "denominator must be positive and exactly divide the internal inch unit",
    );
  }

  const fractionStepTicks = CALIPER_TICKS_PER_INCH / denominator;
  const numerator = quantizeTicks(ticks, fractionStepTicks) / fractionStepTicks;
  return `${formatFraction(numerator, denominator)}${includeUnit ? "\u2033" : ""}`;
}

export function formatCaliperReading(
  ticks: number,
  scale: CaliperScale | CaliperScaleId,
  options: ReadingFormatOptions = {},
): string {
  const resolvedScale =
    typeof scale === "string" ? getCaliperScale(scale) : scale;
  const readingTicks =
    options.quantize === false
      ? ticks
      : quantizeForScale(ticks, resolvedScale);
  const includeUnit = options.includeUnit ?? true;

  if (resolvedScale.format === "fraction") {
    const denominator = resolvedScale.fractionDenominator;
    if (denominator === undefined) {
      throw new Error("fractional scales must declare a denominator");
    }

    return formatFractionalInches(
      readingTicks,
      denominator,
      includeUnit,
    );
  }

  const decimalPlaces = resolvedScale.decimalPlaces;
  if (decimalPlaces === undefined) {
    throw new Error("decimal scales must declare their decimal places");
  }

  const formatted = formatDecimalTicks(
    readingTicks,
    resolvedScale.unit,
    decimalPlaces,
    options,
  );

  if (!includeUnit) {
    return formatted;
  }

  return resolvedScale.unit === "mm" ? `${formatted} mm` : `${formatted}\u2033`;
}

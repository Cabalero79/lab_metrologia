import {
  GONIOMETER_VERNIER_DIVISIONS_PER_SIDE,
  GONIOMETER_VERNIER_SPAN_DEGREES,
  decomposeVernierGoniometerReading,
  type GoniometerDirection,
} from "./vernier-goniometer.ts";

export const VERNIER_GONIOMETER_GEOMETRY_RATIOS = {
  sceneWidth: 12,
  sceneHeight: 6.4,
  pivotX: 5.15,
  pivotY: 3.15,
  headRadius: 1.28,
  dialRadius: 1.12,
  scaleRadius: 1.2,
  bladeLength: 10.6,
  bladeWidth: 0.58,
  bladeOffset: 0.46,
  baseStartX: 5.02,
  baseEndX: 10.25,
  baseTop: 3.42,
  baseBottom: 4.18,
  stockLeft: 8.82,
  stockRight: 9.58,
  stockTop: 1.62,
  stockBottom: 3.45,
  bladeZeroAngleDegrees: 180,
  mainScaleZeroAngleDegrees: 106,
  hitRadius: 1.85,
  deadZoneRadius: 0.36,
} as const;

export interface VernierGoniometerGeometry {
  readonly B: number;
  readonly originX: number;
  readonly originY: number;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly headRadius: number;
  readonly dialRadius: number;
  readonly scaleRadius: number;
  readonly bladeLength: number;
  readonly bladeWidth: number;
  readonly bladeAngleDegrees: number;
  readonly bladeCenterX: number;
  readonly bladeCenterY: number;
  readonly bladeStartX: number;
  readonly bladeStartY: number;
  readonly bladeEndX: number;
  readonly bladeEndY: number;
  readonly baseStartX: number;
  readonly baseEndX: number;
  readonly baseTop: number;
  readonly baseBottom: number;
  readonly stockLeft: number;
  readonly stockRight: number;
  readonly stockTop: number;
  readonly stockBottom: number;
  readonly hitRadius: number;
  readonly deadZoneRadius: number;
  readonly vernierDatumAngleDegrees: number;
  readonly vernierStepDegrees: number;
  readonly matchingVernierDivision: number;
  readonly matchingVernierDirection: -1 | 1;
}

export interface VernierGoniometerDetailViewport {
  readonly zoom: number;
  readonly focusX: number;
  readonly focusY: number;
  readonly targetX: number;
  readonly targetY: number;
}

export interface GoniometerScalePresentation {
  readonly projectionScale: number;
  readonly effectiveBasePx: number;
  readonly mainLabelIntervalDegrees: 10 | 20 | 30;
  readonly mainLabelFontPx: number;
  readonly vernierLabelFontPx: number;
  readonly vernierLabelDivisions: readonly number[];
  readonly mainLabelRadius: number;
  readonly vernierPlateOuterRadius: number;
  readonly vernierPlateInnerRadius: number;
  readonly vernierOuterLabelRadius: number;
  readonly vernierInnerLabelRadius: number;
  readonly vernierEndpointLabelRadius: number;
  readonly zeroLabelRadius: number;
}

/**
 * Projection-only legibility policy. It never changes the 23°/12 physical
 * vernier, the measured angle, or the matching division.
 */
export function getGoniometerScalePresentation(
  layout: VernierGoniometerGeometry,
  projectionScale = 1,
): GoniometerScalePresentation {
  const safeProjectionScale = Math.max(1, projectionScale);
  const effectiveBasePx = layout.B * safeProjectionScale;
  const compactOverview = safeProjectionScale === 1 && effectiveBasePx < 48;
  const mainLabelScreenPx = Math.max(
    compactOverview ? 9 : 10,
    Math.min(safeProjectionScale > 1 ? 18 : 11, effectiveBasePx * 0.1),
  );
  const vernierLabelScreenPx = Math.max(
    compactOverview ? 9 : safeProjectionScale > 1 ? 14 : 10,
    Math.min(safeProjectionScale > 1 ? 18 : 11, effectiveBasePx * 0.09),
  );
  const vernierPlateOuterRadius = layout.scaleRadius - layout.B * 0.18;
  const vernierPlateInnerRadius = layout.dialRadius * 0.38;

  return {
    projectionScale: safeProjectionScale,
    effectiveBasePx,
    mainLabelIntervalDegrees:
      safeProjectionScale > 1 ? 10 : compactOverview ? 30 : 20,
    mainLabelFontPx: mainLabelScreenPx / safeProjectionScale,
    vernierLabelFontPx: vernierLabelScreenPx / safeProjectionScale,
    // The physical overview follows the INSIZE/manual convention and labels
    // only 30' and 60'. The teaching close-up can expose 15' and 45' too.
    vernierLabelDivisions: safeProjectionScale > 1 ? [3, 6, 9, 12] : [6, 12],
    mainLabelRadius: layout.headRadius - layout.B * 0.055,
    vernierPlateOuterRadius,
    vernierPlateInnerRadius,
    // Separate radial tracks keep two-digit minute labels clear without the
    // connector-line tangle used by the previous projection.
    vernierOuterLabelRadius: vernierPlateOuterRadius - layout.B * 0.31,
    vernierInnerLabelRadius: vernierPlateOuterRadius - layout.B * 0.45,
    vernierEndpointLabelRadius: vernierPlateOuterRadius - layout.B * 0.56,
    zeroLabelRadius: vernierPlateOuterRadius - layout.B * 0.42,
  };
}

export function getVernierGoniometerDetailViewport(
  width: number,
  height: number,
  layout: VernierGoniometerGeometry,
): VernierGoniometerDetailViewport {
  const sourceWidth = layout.B * 3.25;
  const oneDegreePitchPx =
    layout.scaleRadius * (Math.PI / 180);
  const minimumScaleZoom = 2 / Math.max(0.1, oneDegreePitchPx);
  const alternatingLabelTrackRadius = layout.B * 0.71;
  const alternatingLabelSeparationRadians = (11.5 * Math.PI) / 180;
  const alternatingLabelChord =
    2 * alternatingLabelTrackRadius *
    Math.sin(alternatingLabelSeparationRadians / 2);
  const minimumLabelZoom = 16 / Math.max(0.1, alternatingLabelChord);
  const datumRadians = (layout.vernierDatumAngleDegrees * Math.PI) / 180;
  const focusRadius = layout.dialRadius * 0.84;
  return {
    zoom: Math.min(
      4.8,
      Math.max(
        1.8,
        (width * 0.76) / sourceWidth,
        minimumScaleZoom,
        minimumLabelZoom,
      ),
    ),
    // Focus the real reading seam, not the center knob. This keeps the full
    // active vernier side in view while removing unrelated hardware.
    focusX: layout.pivotX + Math.cos(datumRadians) * focusRadius,
    focusY: layout.pivotY + Math.sin(datumRadians) * focusRadius,
    targetX: width * 0.49,
    targetY: height * 0.52,
  };
}

export function getVernierGoniometerGeometry(
  width: number,
  height: number,
  ticks: number,
  direction: GoniometerDirection = "clockwise",
): VernierGoniometerGeometry {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new RangeError("width and height must be finite and positive");
  }
  const ratios = VERNIER_GONIOMETER_GEOMETRY_RATIOS;
  const B = Math.max(1, Math.min(width / ratios.sceneWidth, height / ratios.sceneHeight));
  const originX = (width - ratios.sceneWidth * B) / 2;
  const originY = (height - ratios.sceneHeight * B) / 2;
  const pivotX = originX + ratios.pivotX * B;
  const pivotY = originY + ratios.pivotY * B;
  const reading = decomposeVernierGoniometerReading(ticks, direction);
  const bladeAngleDegrees =
    (ratios.bladeZeroAngleDegrees - reading.angleDegrees + 360) % 360;
  const bladeAngleRadians = (bladeAngleDegrees * Math.PI) / 180;
  const halfBlade = (ratios.bladeLength * B) / 2;
  const dx = Math.cos(bladeAngleRadians) * halfBlade;
  const dy = Math.sin(bladeAngleRadians) * halfBlade;
  const bladeCenterX =
    pivotX - Math.sin(bladeAngleRadians) * ratios.bladeOffset * B;
  const bladeCenterY =
    pivotY + Math.cos(bladeAngleRadians) * ratios.bladeOffset * B;

  return {
    B,
    originX,
    originY,
    pivotX,
    pivotY,
    headRadius: ratios.headRadius * B,
    dialRadius: ratios.dialRadius * B,
    scaleRadius: ratios.scaleRadius * B,
    bladeLength: ratios.bladeLength * B,
    bladeWidth: ratios.bladeWidth * B,
    bladeAngleDegrees,
    bladeCenterX,
    bladeCenterY,
    bladeStartX: bladeCenterX - dx,
    bladeStartY: bladeCenterY - dy,
    bladeEndX: bladeCenterX + dx,
    bladeEndY: bladeCenterY + dy,
    baseStartX: originX + ratios.baseStartX * B,
    baseEndX: originX + ratios.baseEndX * B,
    baseTop: originY + ratios.baseTop * B,
    baseBottom: originY + ratios.baseBottom * B,
    stockLeft: originX + ratios.stockLeft * B,
    stockRight: originX + ratios.stockRight * B,
    stockTop: originY + ratios.stockTop * B,
    stockBottom: originY + ratios.stockBottom * B,
    hitRadius: Math.max(44, ratios.hitRadius * B),
    deadZoneRadius: ratios.deadZoneRadius * B,
    vernierDatumAngleDegrees:
      (ratios.mainScaleZeroAngleDegrees - reading.angleDegrees + 360) % 360,
    vernierStepDegrees:
      GONIOMETER_VERNIER_SPAN_DEGREES /
      GONIOMETER_VERNIER_DIVISIONS_PER_SIDE,
    matchingVernierDivision: reading.vernierDivision,
    matchingVernierDirection: direction === "clockwise" ? 1 : -1,
  };
}

export function getGoniometerMainScaleMarkAngleDegrees(
  mainScaleDegree: number,
): number {
  if (!Number.isInteger(mainScaleDegree)) {
    throw new RangeError("mainScaleDegree must be an integer");
  }
  return (
    VERNIER_GONIOMETER_GEOMETRY_RATIOS.mainScaleZeroAngleDegrees -
    mainScaleDegree
  );
}

export function getGoniometerVernierMarkAngleDegrees(
  ticks: number,
  division: number,
  direction: -1 | 1,
): number {
  if (!Number.isInteger(division) || division < 0 || division > 12) {
    throw new RangeError("division must be an integer from 0 to 12");
  }
  const reading = decomposeVernierGoniometerReading(ticks);
  const zeroAngle =
    VERNIER_GONIOMETER_GEOMETRY_RATIOS.mainScaleZeroAngleDegrees -
    reading.angleDegrees;
  return (
    zeroAngle +
    direction *
      division *
      (GONIOMETER_VERNIER_SPAN_DEGREES /
        GONIOMETER_VERNIER_DIVISIONS_PER_SIDE)
  );
}

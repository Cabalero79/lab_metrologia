import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeInternalMicrometerReading,
  snapInternalMicrometerTicks,
} from "./internal-micrometer.ts";

export const INTERNAL_MICROMETER_GEOMETRY_RATIOS = {
  sceneWidth: 13.2,
  sceneHeight: 5.1,
  insetX: 0.2,
  headX: 1.05,
  axisY: 2.55,
  sleeveStartX: 3.15,
  sleeveEndAtMinimumX: 8.4,
  sleeveTravel: 3.25,
  sleeveRadius: 0.72,
  thimbleLength: 3.75,
  thimbleRadius: 1.08,
  ratchetLength: 0.82,
  contactBaseGap: 0.66,
  contactExpansion: 0.78,
} as const;

export interface InternalMicrometerGeometry {
  readonly B: number;
  readonly originX: number;
  readonly originY: number;
  readonly sceneRight: number;
  readonly sceneBottom: number;
  readonly axisY: number;
  readonly headX: number;
  readonly sleeveStartX: number;
  readonly sleeveEndX: number;
  readonly sleeveTop: number;
  readonly sleeveBottom: number;
  readonly sleeveRadius: number;
  readonly pixelsPerMm: number;
  readonly travelPx: number;
  readonly scaleMaximumX: number;
  readonly scaleMinimumX: number;
  readonly thimbleLeft: number;
  readonly thimbleRight: number;
  readonly thimbleTop: number;
  readonly thimbleBottom: number;
  readonly thimbleRadius: number;
  readonly ratchetLeft: number;
  readonly ratchetRight: number;
  readonly contactCenterX: number;
  readonly upperContactY: number;
  readonly lowerContactY: number;
  readonly contactGapPx: number;
  readonly referenceY: number;
  readonly thimbleDivision: number;
  readonly thimbleAngleDegrees: number;
  readonly hitLeft: number;
  readonly hitTop: number;
  readonly hitRight: number;
  readonly hitBottom: number;
}

export function getInternalMicrometerGeometry(
  width: number,
  height: number,
  ticks: number,
): InternalMicrometerGeometry {
  const r = INTERNAL_MICROMETER_GEOMETRY_RATIOS;
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const B = Math.max(1, Math.min(safeWidth / r.sceneWidth, safeHeight / r.sceneHeight));
  const sceneWidth = r.sceneWidth * B;
  const sceneHeight = r.sceneHeight * B;
  const originX = Math.max(0, (safeWidth - sceneWidth) / 2);
  const originY = Math.max(0, (safeHeight - sceneHeight) / 2);
  const snapped = snapInternalMicrometerTicks(ticks);
  const progress =
    (snapped - INTERNAL_MICROMETER_MIN_TICKS) /
    (INTERNAL_MICROMETER_MAX_TICKS - INTERNAL_MICROMETER_MIN_TICKS);
  const axisY = originY + r.axisY * B;
  const sleeveStartX = originX + r.sleeveStartX * B;
  const sleeveEndAtMinimumX = originX + r.sleeveEndAtMinimumX * B;
  const travelPx = progress * r.sleeveTravel * B;
  // The internal micrometer reference advances toward the measuring head:
  // dragging the thimble left increases the indicated internal diameter.
  const sleeveEndX = sleeveEndAtMinimumX - travelPx;
  const pixelsPerMm =
    (r.sleeveTravel * B) /
    ((INTERNAL_MICROMETER_MAX_TICKS - INTERNAL_MICROMETER_MIN_TICKS) /
      INTERNAL_MICROMETER_TICKS_PER_MM);
  const scaleSpanPx =
    ((INTERNAL_MICROMETER_MAX_TICKS - INTERNAL_MICROMETER_MIN_TICKS) /
      INTERNAL_MICROMETER_TICKS_PER_MM) *
    pixelsPerMm;
  const scaleMaximumX = sleeveEndX + travelPx - scaleSpanPx;
  const scaleMinimumX = scaleMaximumX + scaleSpanPx;
  const sleeveRadius = r.sleeveRadius * B;
  const thimbleRadius = r.thimbleRadius * B;
  const thimbleLeft = sleeveEndX - B * 0.08;
  const thimbleRight = thimbleLeft + r.thimbleLength * B;
  const ratchetLeft = thimbleRight;
  const ratchetRight = ratchetLeft + r.ratchetLength * B;
  const contactGapPx =
    (r.contactBaseGap + progress * r.contactExpansion) * B;
  const contactCenterX = originX + r.headX * B;
  const reading = decomposeInternalMicrometerReading(snapped);

  return {
    B,
    originX,
    originY,
    sceneRight: originX + sceneWidth,
    sceneBottom: originY + sceneHeight,
    axisY,
    headX: originX + r.headX * B,
    sleeveStartX,
    sleeveEndX,
    sleeveTop: axisY - sleeveRadius,
    sleeveBottom: axisY + sleeveRadius,
    sleeveRadius,
    pixelsPerMm,
    travelPx,
    scaleMaximumX,
    scaleMinimumX,
    thimbleLeft,
    thimbleRight,
    thimbleTop: axisY - thimbleRadius,
    thimbleBottom: axisY + thimbleRadius,
    thimbleRadius,
    ratchetLeft,
    ratchetRight,
    contactCenterX,
    upperContactY: axisY - contactGapPx / 2,
    lowerContactY: axisY + contactGapPx / 2,
    contactGapPx,
    referenceY: axisY,
    thimbleDivision: reading.phaseTicks,
    thimbleAngleDegrees:
      (reading.phaseTicks * 360) / INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    hitLeft: thimbleLeft - B * 0.15,
    hitTop: axisY - thimbleRadius - B * 0.18,
    hitRight: ratchetRight + B * 0.1,
    hitBottom: axisY + thimbleRadius + B * 0.18,
  };
}

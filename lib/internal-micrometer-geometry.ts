import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeInternalMicrometerReading,
  snapInternalMicrometerTicks,
} from "./internal-micrometer.ts";

export const INTERNAL_MICROMETER_GEOMETRY_RATIOS = {
  sceneWidth: 13.8,
  sceneHeight: 5.1,
  insetX: 0.2,
  axisY: 3.05,
  fixedJawX: 3.1,
  sleeveStartX: 3.42,
  sleeveEndAtMinimumX: 9.1,
  sleeveTravel: 3.25,
  sleeveRadius: 0.62,
  thimbleLength: 3.45,
  thimbleRadius: 0.92,
  ratchetLength: 0.88,
  contactBaseSpan: 0.58,
  contactExpansion: 1.25,
  jawStemWidth: 0.46,
  jawTipWidth: 0.13,
  jawTipTopOffset: 2.04,
  jawTipHeight: 0.36,
} as const;

export interface InternalMicrometerGeometry {
  readonly B: number;
  readonly originX: number;
  readonly originY: number;
  readonly sceneRight: number;
  readonly sceneBottom: number;
  readonly axisY: number;
  readonly fixedJawX: number;
  readonly movingJawX: number;
  readonly jawTipTop: number;
  readonly jawTipBottom: number;
  readonly jawShoulderY: number;
  readonly jawBaseTop: number;
  readonly jawBaseBottom: number;
  readonly jawStemWidth: number;
  readonly jawTipWidth: number;
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
  readonly leftContactX: number;
  readonly rightContactX: number;
  readonly contactSpanPx: number;
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
  const fixedJawX = originX + r.fixedJawX * B;
  const jawTipWidth = r.jawTipWidth * B;
  const jawStemWidth = r.jawStemWidth * B;
  const contactCenterSpan =
    (r.contactBaseSpan + progress * r.contactExpansion) * B;
  const movingJawX = fixedJawX - contactCenterSpan;
  const leftContactX = movingJawX - jawTipWidth / 2;
  const rightContactX = fixedJawX + jawTipWidth / 2;
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
  const reading = decomposeInternalMicrometerReading(snapped);

  return {
    B,
    originX,
    originY,
    sceneRight: originX + sceneWidth,
    sceneBottom: originY + sceneHeight,
    axisY,
    fixedJawX,
    movingJawX,
    jawTipTop: axisY - r.jawTipTopOffset * B,
    jawTipBottom:
      axisY - (r.jawTipTopOffset - r.jawTipHeight) * B,
    jawShoulderY: axisY - B * 1.24,
    jawBaseTop: axisY - B * 0.5,
    jawBaseBottom: axisY + B * 0.5,
    jawStemWidth,
    jawTipWidth,
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
    leftContactX,
    rightContactX,
    contactSpanPx: rightContactX - leftContactX,
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

import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeInternalMicrometerReading,
  snapInternalMicrometerTicks,
} from "./internal-micrometer.ts";

export const INTERNAL_MICROMETER_GEOMETRY_RATIOS = {
  sceneWidth: 11.9,
  sceneHeight: 5.3,
  insetX: 0.2,
  axisY: 3.3,
  fixedJawX: 3.45,
  sleeveStartX: 3.85,
  sleeveEndAtMinimumX: 6.52,
  sleeveTravel: 2.55,
  sleeveRadius: 0.5,
  thimbleScaleLength: 2.15,
  thimbleScaleRadius: 0.75,
  gripLength: 1.85,
  gripRadius: 0.86,
  ratchetNeckLength: 0.38,
  ratchetLength: 1.05,
  ratchetRadius: 0.58,
  contactPixelsPerMm: 0.1,
  jawStemWidth: 0.94,
  jawTipWidth: 0.2,
  jawPinInwardOffset: 0.28,
  jawTipTopOffset: 2.33,
  jawTipHeight: 0.42,
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
  readonly fixedPinCenterX: number;
  readonly movingPinCenterX: number;
  readonly fixedInnerFaceX: number;
  readonly movingInnerFaceX: number;
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
  readonly scaleCollarRight: number;
  readonly gripLeft: number;
  readonly gripRight: number;
  readonly gripTop: number;
  readonly gripBottom: number;
  readonly ratchetNeckLeft: number;
  readonly ratchetNeckRight: number;
  readonly ratchetLeft: number;
  readonly ratchetRight: number;
  readonly ratchetTop: number;
  readonly ratchetBottom: number;
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
  const contactSpanPx =
    (snapped / INTERNAL_MICROMETER_TICKS_PER_MM) *
    r.contactPixelsPerMm *
    B;
  const pinInwardOffset = r.jawPinInwardOffset * B;
  const fixedPinCenterX = fixedJawX - pinInwardOffset;
  const rightContactX = fixedPinCenterX + jawTipWidth / 2;
  const leftContactX = rightContactX - contactSpanPx;
  const movingPinCenterX = leftContactX + jawTipWidth / 2;
  const movingJawX = movingPinCenterX - pinInwardOffset;
  const fixedInnerFaceX = fixedPinCenterX - jawTipWidth / 2;
  const movingInnerFaceX = movingPinCenterX + jawTipWidth / 2;
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
  const thimbleRadius = r.thimbleScaleRadius * B;
  const thimbleLeft = sleeveEndX - B * 0.08;
  const scaleCollarRight = thimbleLeft + r.thimbleScaleLength * B;
  const gripLeft = scaleCollarRight;
  const gripRight = gripLeft + r.gripLength * B;
  const ratchetNeckLeft = gripRight;
  const ratchetNeckRight = ratchetNeckLeft + r.ratchetNeckLength * B;
  const ratchetLeft = ratchetNeckRight;
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
    fixedPinCenterX,
    movingPinCenterX,
    fixedInnerFaceX,
    movingInnerFaceX,
    jawTipTop: axisY - r.jawTipTopOffset * B,
    jawTipBottom:
      axisY - (r.jawTipTopOffset - r.jawTipHeight) * B,
    jawShoulderY: axisY - B * 1.08,
    jawBaseTop: axisY - B * 0.6,
    jawBaseBottom: axisY + B * 0.56,
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
    thimbleRight: gripRight,
    thimbleTop: axisY - thimbleRadius,
    thimbleBottom: axisY + thimbleRadius,
    thimbleRadius,
    scaleCollarRight,
    gripLeft,
    gripRight,
    gripTop: axisY - r.gripRadius * B,
    gripBottom: axisY + r.gripRadius * B,
    ratchetNeckLeft,
    ratchetNeckRight,
    ratchetLeft,
    ratchetRight,
    ratchetTop: axisY - r.ratchetRadius * B,
    ratchetBottom: axisY + r.ratchetRadius * B,
    leftContactX,
    rightContactX,
    contactSpanPx,
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

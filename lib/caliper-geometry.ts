import {
  CALIPER_TICKS_PER_MM,
  type CaliperScale,
} from "./caliper.ts";

/**
 * Canonical mechanical proportions, expressed in beam heights (B).
 * The whole scene is projected with one uniform scale, so changing the canvas
 * aspect ratio can only add letterboxing; it cannot deform the instrument.
 */
export const CALIPER_GEOMETRY_RATIOS = {
  // Maximum moving-cursor envelope at 150 mm is 14.036 B. The remaining
  // 0.414 B is deliberate technical margin, not unused scaling space.
  sceneWidth: 14.45,
  sceneHeight: 5.56,
  sceneInsetX: 0.18,
  beamY: 1.45,
  beamHeight: 1,
  upperTipAboveBeam: 1.365,
  internalShelfAboveBeam: 0.346,
  // The lower jaws begin on the exact lower seam of the vernier carriage:
  // 0.821 B + 0.481 B - 1 B (beam height) = 0.302 B below the beam.
  contactTopBelowBeam: 0.302,
  jawBottomBelowBeam: 2.686,
  externalJawSpan: 0.885,
  heelSpan: 0.4,
  scaleToContactOffset: 0.577,
  scaleSpan150Mm: 9.25,
  beamTail: 0.25,
  upperPlateContactInset: 0.112,
  upperPlateWidth: 3.609,
  upperPlateHeight: 0.532,
  upperPlateBottomBelowBeamTop: 0.186,
  vernierTopBelowBeamTop: 0.821,
  vernierHeight: 0.481,
  screwCenterRatio: 0.5,
  screwTopAbovePlate: 0.282,
  rollerCenterRatio: 0.871,
  rollerRadius: 0.429,
  dimensionGap: 0.23,
  stepDatumOffset: 0.22,
} as const;

export interface CaliperGeometry {
  readonly B: number;
  readonly originX: number;
  readonly originY: number;
  readonly sceneRight: number;
  readonly side: number;
  readonly fixedContactX: number;
  readonly mainZeroX: number;
  readonly scaleToContactOffset: number;
  readonly pixelsPerMm: number;
  readonly beamEnd: number;
  readonly beamY: number;
  readonly beamHeight: number;
  readonly beamBottom: number;
  readonly jawBottom: number;
  readonly contactTopY: number;
  readonly upperTipY: number;
  readonly movingScaleZeroX: number;
  readonly movingContactX: number;
  readonly travelPx: number;
  readonly externalJawSpan: number;
  readonly heelSpan: number;
  readonly fixedInternalFaceX: number;
  readonly movingInternalRootX: number;
  readonly movingInternalFaceX: number;
  readonly internalShelfY: number;
  readonly sliderTop: number;
  readonly sliderRight: number;
  readonly upperPlateLeft: number;
  readonly upperPlateBottom: number;
  readonly vernierTop: number;
  readonly vernierBottom: number;
  readonly vernierStepPx: number;
  readonly screwX: number;
  readonly screwTop: number;
  readonly rollerX: number;
  readonly rollerRadius: number;
  readonly fixedStepDatumX: number;
  readonly movingStepDatumX: number;
  readonly dimensionY: number;
}

function fractionToNumber(fraction: CaliperScale["mainScaleDivision"]): number {
  return fraction.numerator / fraction.denominator;
}

/** Physical pitch of adjacent vernier marks, in millimetres. */
export function getVernierPitchMm(scale: CaliperScale): number {
  // Extended metric verniers: 20 divisions span 39 mm and 10 span 19 mm.
  // For 0.05 mm, reading 58.35 aligns mark 7 at 58.35 + 7*1.95 = 72.00 mm.
  if (scale.id === "mm-0.05") return 1.95;
  if (scale.id === "mm-0.1") return 1.9;

  const mainDivisionMm = scale.unit === "mm"
    ? fractionToNumber(scale.mainScaleDivision)
    : fractionToNumber(scale.mainScaleDivision) * 25.4;
  const resolutionMm = scale.stepTicks / CALIPER_TICKS_PER_MM;
  return mainDivisionMm - resolutionMm;
}

export function getCaliperGeometry(
  width: number,
  height: number,
  valueMm: number,
  scale: CaliperScale,
): CaliperGeometry {
  const r = CALIPER_GEOMETRY_RATIOS;
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const B = Math.max(
    1,
    Math.min(safeWidth / r.sceneWidth, safeHeight / r.sceneHeight),
  );
  const originX = (safeWidth - r.sceneWidth * B) / 2;
  const originY = (safeHeight - r.sceneHeight * B) / 2;
  const u = (value: number) => value * B;

  const side = originX + u(r.sceneInsetX);
  const externalJawSpan = u(r.externalJawSpan);
  const fixedContactX = side + externalJawSpan;
  const scaleToContactOffset = u(r.scaleToContactOffset);
  const mainZeroX = fixedContactX + scaleToContactOffset;
  const pixelsPerMm = u(r.scaleSpan150Mm) / 150;
  // valueMm is already the exact, scale-quantized reading supplied by ticksToMm.
  const travelPx = valueMm * pixelsPerMm;
  const movingScaleZeroX = mainZeroX + travelPx;
  const movingContactX = fixedContactX + travelPx;
  const scaleEndX = mainZeroX + u(r.scaleSpan150Mm);
  const beamEnd = scaleEndX + u(r.beamTail);

  const beamY = originY + u(r.beamY);
  const beamHeight = B;
  const beamBottom = beamY + B;
  const upperTipY = beamY - u(r.upperTipAboveBeam);
  const internalShelfY = beamY - u(r.internalShelfAboveBeam);
  const contactTopY = beamBottom + u(r.contactTopBelowBeam);
  const jawBottom = beamBottom + u(r.jawBottomBelowBeam);

  const fixedInternalFaceX = fixedContactX - externalJawSpan * 0.52;
  const movingInternalRootX = movingContactX - externalJawSpan;
  const movingInternalFaceX = movingContactX - externalJawSpan * 0.52;

  const upperPlateBottom = beamY + u(r.upperPlateBottomBelowBeamTop);
  const sliderTop = upperPlateBottom - u(r.upperPlateHeight);
  const upperPlateLeft = movingContactX + u(r.upperPlateContactInset);
  const sliderRight = upperPlateLeft + u(r.upperPlateWidth);
  const vernierTop = beamY + u(r.vernierTopBelowBeamTop);
  const vernierBottom = vernierTop + u(r.vernierHeight);
  const vernierStepPx = getVernierPitchMm(scale) * pixelsPerMm;
  const screwX = upperPlateLeft + u(r.upperPlateWidth * r.screwCenterRatio);
  const screwTop = sliderTop - u(r.screwTopAbovePlate);
  const rollerX = upperPlateLeft + u(r.upperPlateWidth * r.rollerCenterRatio);
  const rollerRadius = u(r.rollerRadius);

  const fixedStepDatumX = fixedContactX + u(r.stepDatumOffset);
  const movingStepDatumX = fixedStepDatumX + travelPx;

  return {
    B,
    originX,
    originY,
    sceneRight: originX + u(r.sceneWidth),
    side,
    fixedContactX,
    mainZeroX,
    scaleToContactOffset,
    pixelsPerMm,
    beamEnd,
    beamY,
    beamHeight,
    beamBottom,
    jawBottom,
    contactTopY,
    upperTipY,
    movingScaleZeroX,
    movingContactX,
    travelPx,
    externalJawSpan,
    heelSpan: u(r.heelSpan),
    fixedInternalFaceX,
    movingInternalRootX,
    movingInternalFaceX,
    internalShelfY,
    sliderTop,
    sliderRight,
    upperPlateLeft,
    upperPlateBottom,
    vernierTop,
    vernierBottom,
    vernierStepPx,
    screwX,
    screwTop,
    rollerX,
    rollerRadius,
    fixedStepDatumX,
    movingStepDatumX,
    dimensionY: jawBottom + u(r.dimensionGap),
  };
}

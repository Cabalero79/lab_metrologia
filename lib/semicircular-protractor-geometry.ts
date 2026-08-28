import {
  PROTRACTOR_MAX_ARC_MINUTES,
  PROTRACTOR_MIN_ARC_MINUTES,
  PROTRACTOR_MINUTES_PER_DEGREE,
  snapSemicircularProtractorArcMinutes,
} from "./semicircular-protractor.ts";

export interface SemicircularProtractorGeometry {
  readonly width: number;
  readonly height: number;
  readonly B: number;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly outerRadius: number;
  readonly labelRadius: number;
  readonly pointerLength: number;
  readonly tailLength: number;
  readonly bladeWidth: number;
  readonly hubRadius: number;
  readonly bladePointerX: number;
  readonly bladePointerY: number;
  readonly bladeTailX: number;
  readonly bladeTailY: number;
  readonly baseStartX: number;
  readonly baseEndX: number;
  readonly hitRadius: number;
  readonly deadZoneRadius: number;
  readonly angleDegrees: number;
}

export interface ProtractorDetailPresentation {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly centerX: number;
  readonly baselineY: number;
  readonly minuteStepPitch: number;
  readonly visibleStepRadius: number;
  readonly arcMinutes: number;
}

function assertPositiveFinite(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be positive and finite`);
  }
}

export function getSemicircularProtractorGeometry(
  width: number,
  height: number,
  arcMinutes: number,
): SemicircularProtractorGeometry {
  assertPositiveFinite(width, "width");
  assertPositiveFinite(height, "height");
  const snapped = snapSemicircularProtractorArcMinutes(arcMinutes);
  const sidePadding = Math.max(12, Math.min(34, width * 0.035));
  const topPadding =
    width < 480
      ? Math.max(72, Math.min(84, height * 0.2))
      : Math.max(16, Math.min(34, height * 0.065));
  const bottomPadding = Math.max(14, Math.min(28, height * 0.055));
  const tailRatio = 0.3;
  const outerRadius = Math.max(
    48,
    Math.min(
      (width - sidePadding * 2) / 2,
      (height - topPadding - bottomPadding) / (1 + tailRatio),
    ),
  );
  const pivotX = width / 2;
  const pivotY = topPadding + outerRadius;
  const angleDegrees = snapped / PROTRACTOR_MINUTES_PER_DEGREE;
  const radians = (angleDegrees * Math.PI) / 180;
  const pointerLength = outerRadius * 0.955;
  const tailLength = outerRadius * tailRatio;
  const bladeWidth = Math.max(9, outerRadius * 0.052);
  const B = outerRadius / 10;

  return {
    width,
    height,
    B,
    pivotX,
    pivotY,
    outerRadius,
    labelRadius: outerRadius * 0.79,
    pointerLength,
    tailLength,
    bladeWidth,
    hubRadius: Math.max(3.5, Math.min(5.5, B * 0.22)),
    bladePointerX: pivotX - Math.cos(radians) * pointerLength,
    bladePointerY: pivotY - Math.sin(radians) * pointerLength,
    bladeTailX: pivotX + Math.cos(radians) * tailLength,
    bladeTailY: pivotY + Math.sin(radians) * tailLength,
    baseStartX: pivotX - outerRadius,
    baseEndX: pivotX + outerRadius,
    hitRadius: Math.max(24, bladeWidth * 1.8),
    deadZoneRadius: Math.max(18, outerRadius * 0.07),
    angleDegrees,
  };
}

export function getProtractorScalePoint(
  geometry: SemicircularProtractorGeometry,
  degrees: number,
  radius = geometry.outerRadius,
) {
  const radians = Math.PI + (degrees * Math.PI) / 180;
  return {
    x: geometry.pivotX + Math.cos(radians) * radius,
    y: geometry.pivotY + Math.sin(radians) * radius,
  };
}

export function getProtractorDetailPresentation(
  width: number,
  height: number,
  arcMinutes: number,
): ProtractorDetailPresentation {
  assertPositiveFinite(width, "width");
  assertPositiveFinite(height, "height");
  const horizontalInset = Math.max(18, Math.min(72, width * 0.075));
  const left = horizontalInset;
  const right = width - horizontalInset;
  const top =
    width < 480
      ? Math.max(100, height * 0.24)
      : Math.max(58, height * 0.18);
  const bottom = Math.min(height - 34, height * 0.82);
  const minuteStepPitch = Math.max(7, Math.min(12, width / 42));
  const centerX = width / 2;
  return {
    left,
    right,
    top,
    bottom,
    centerX,
    baselineY: top + (bottom - top) * 0.56,
    minuteStepPitch,
    visibleStepRadius: Math.max(
      14,
      Math.ceil(
        Math.max(centerX - left, right - centerX) / minuteStepPitch,
      ) + 1,
    ),
    arcMinutes: Math.max(
      PROTRACTOR_MIN_ARC_MINUTES,
      Math.min(PROTRACTOR_MAX_ARC_MINUTES, arcMinutes),
    ),
  };
}

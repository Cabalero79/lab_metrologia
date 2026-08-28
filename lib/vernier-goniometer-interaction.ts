import {
  GONIOMETER_MINUTES_PER_DEGREE,
  snapVernierGoniometerTicks,
} from "./vernier-goniometer.ts";

export function getPointerAngleDegrees(
  pointerX: number,
  pointerY: number,
  pivotX: number,
  pivotY: number,
): number {
  for (const [name, value] of Object.entries({ pointerX, pointerY, pivotX, pivotY })) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${name} must be a finite number`);
    }
  }
  const angle = (Math.atan2(pointerY - pivotY, pointerX - pivotX) * 180) / Math.PI;
  return ((angle % 360) + 360) % 360;
}

export function getShortestAngularDeltaDegrees(
  originAngleDegrees: number,
  currentAngleDegrees: number,
): number {
  if (!Number.isFinite(originAngleDegrees) || !Number.isFinite(currentAngleDegrees)) {
    throw new RangeError("angles must be finite numbers");
  }
  return ((currentAngleDegrees - originAngleDegrees + 540) % 360) - 180;
}

export function getVernierGoniometerDragTicks(
  originTicks: number,
  originPointerAngleDegrees: number,
  currentPointerAngleDegrees: number,
): number {
  const deltaDegrees = getShortestAngularDeltaDegrees(
    originPointerAngleDegrees,
    currentPointerAngleDegrees,
  );
  return snapVernierGoniometerTicks(
    originTicks + deltaDegrees * GONIOMETER_MINUTES_PER_DEGREE,
  );
}

export function isPointerOutsidePivotDeadZone(
  pointerX: number,
  pointerY: number,
  pivotX: number,
  pivotY: number,
  deadZoneRadius: number,
): boolean {
  if (!Number.isFinite(deadZoneRadius) || deadZoneRadius < 0) {
    throw new RangeError("deadZoneRadius must be finite and non-negative");
  }
  return Math.hypot(pointerX - pivotX, pointerY - pivotY) >= deadZoneRadius;
}

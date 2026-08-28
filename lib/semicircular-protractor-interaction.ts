import {
  PROTRACTOR_MIN_ARC_MINUTES,
  PROTRACTOR_MINUTES_PER_DEGREE,
  PROTRACTOR_RESOLUTION_ARC_MINUTES,
  snapSemicircularProtractorArcMinutes,
} from "./semicircular-protractor.ts";

function assertFiniteEntries(entries: Record<string, number>) {
  for (const [name, value] of Object.entries(entries)) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${name} must be finite`);
    }
  }
}

export function getSemicircularProtractorArcMinutesFromPointer(
  pointerX: number,
  pointerY: number,
  pivotX: number,
  pivotY: number,
): number {
  assertFiniteEntries({ pointerX, pointerY, pivotX, pivotY });
  if (pointerY >= pivotY) {
    return pointerX <= pivotX
      ? PROTRACTOR_MIN_ARC_MINUTES
      : 180 * PROTRACTOR_MINUTES_PER_DEGREE;
  }
  const degrees =
    (Math.atan2(pivotY - pointerY, pivotX - pointerX) * 180) / Math.PI;
  return snapSemicircularProtractorArcMinutes(
    degrees * PROTRACTOR_MINUTES_PER_DEGREE,
  );
}

export function getSemicircularProtractorDetailDragArcMinutes(
  originArcMinutes: number,
  deltaX: number,
  pixelsPerFiveMinutes: number,
): number {
  assertFiniteEntries({ originArcMinutes, deltaX, pixelsPerFiveMinutes });
  if (pixelsPerFiveMinutes <= 0) {
    throw new RangeError("pixelsPerFiveMinutes must be positive");
  }
  return snapSemicircularProtractorArcMinutes(
    originArcMinutes -
      (deltaX / pixelsPerFiveMinutes) * PROTRACTOR_RESOLUTION_ARC_MINUTES,
  );
}

export function distanceToSegment(
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  assertFiniteEntries({ x, y, startX, startY, endX, endY });
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSquared),
        );
  return Math.hypot(x - (startX + t * dx), y - (startY + t * dy));
}

export function isPointerOutsideProtractorDeadZone(
  pointerX: number,
  pointerY: number,
  pivotX: number,
  pivotY: number,
  deadZoneRadius: number,
) {
  assertFiniteEntries({ pointerX, pointerY, pivotX, pivotY, deadZoneRadius });
  if (deadZoneRadius < 0) {
    throw new RangeError("deadZoneRadius must be non-negative");
  }
  return Math.hypot(pointerX - pivotX, pointerY - pivotY) >= deadZoneRadius;
}

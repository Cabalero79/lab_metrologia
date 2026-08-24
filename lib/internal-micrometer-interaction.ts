import {
  INTERNAL_MICROMETER_RESOLUTION_TICKS,
  snapInternalMicrometerTicks,
} from "./internal-micrometer.ts";

/**
 * Keep pointer precision independent from the compact physical projection.
 * One horizontal CSS pixel corresponds to one representable 0.01 mm step, so
 * mouse and touch dragging can reach every value without skipping ticks.
 */
export const INTERNAL_MICROMETER_DRAG_PIXELS_PER_STEP = 1;

export function getInternalMicrometerDragTicks(
  originTicks: number,
  deltaCssPixels: number,
): number {
  if (!Number.isFinite(deltaCssPixels)) {
    throw new RangeError("deltaCssPixels must be a finite number");
  }

  const deltaSteps =
    deltaCssPixels / INTERNAL_MICROMETER_DRAG_PIXELS_PER_STEP;
  return snapInternalMicrometerTicks(
    originTicks - deltaSteps * INTERNAL_MICROMETER_RESOLUTION_TICKS,
  );
}

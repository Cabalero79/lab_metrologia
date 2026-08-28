import {
  DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
  snapExternalMicrometerTicks,
  type ExternalMicrometerProfileId,
} from "./external-micrometer.ts";

export function getExternalMicrometerDragTicks(
  originTicks: number,
  deltaCssPixels: number,
  ticksPerCssPixel: number,
  profileId: ExternalMicrometerProfileId =
    DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
): number {
  if (!Number.isFinite(deltaCssPixels)) {
    throw new RangeError("deltaCssPixels must be a finite number");
  }
  if (!Number.isFinite(ticksPerCssPixel) || ticksPerCssPixel <= 0) {
    throw new RangeError("ticksPerCssPixel must be finite and positive");
  }

  return snapExternalMicrometerTicks(
    originTicks + deltaCssPixels * ticksPerCssPixel,
    profileId,
  );
}

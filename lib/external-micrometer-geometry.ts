import {
  EXTERNAL_MICROMETER_MAX_TICKS,
  EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  EXTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeExternalMicrometerReading,
  snapExternalMicrometerTicks,
} from "./external-micrometer.ts";

export type ExternalMicrometerReferencePathCommand =
  | readonly ["move", number, number]
  | readonly ["line", number, number]
  | readonly ["curve", number, number, number, number, number, number];

export const EXTERNAL_MICROMETER_GEOMETRY_RATIOS = {
  sceneWidth: 14.09,
  sceneHeight: 5.2,
  axisY: 1.18,
  frameLeft: 0.66,
  frameRight: 5.52,
  frameBottom: 4.96,
  anvilFaceX: 1.56,
  guideEntryX: 4.8,
  bossLeft: 4.36,
  bossRight: 5.52,
  contactPixelsPerMm: 0.1,
  sleeveStartX: 5.32,
  zeroSeamX: 5.94,
  thimbleConeLength: 2.05,
  gripLength: 1.86,
  neckLength: 0.4,
  ratchetLength: 1.18,
} as const;

/**
 * Optical calibration requested by the product owner on 01/09/2026.
 *
 * The exact reading datum remains on the longitudinal graduation. Only the
 * visible leading edge of the thimble shell receives this half-centesimal
 * preload, so the integer measurement model and axial travel stay unchanged.
 */
export const EXTERNAL_MICROMETER_OPTICAL_SEAM_OFFSET_TICKS = -5;

/**
 * Contorno externo rastreado de `Exemplos/ferradura.png` com OpenCV
 * (`threshold=80`, `RETR_EXTERNAL`, `approxPolyDP epsilon=1.5`).
 *
 * Source pixels remain intact here. Projection applies one uniform scale to both
 * axes, preventing the reference from being stretched to fit hand-picked bounds.
 */
export const EXTERNAL_MICROMETER_CIRCULAR_FRAME_REFERENCE = {
  crop: { left: 22, top: 18, right: 543, bottom: 469 },
  outerTopFromAxis: -0.78,
  outerBottomFromAxis: 3.84,
  points: [
    [540, 19],
    [411, 18],
    [409, 20],
    [409, 129],
    [418, 137],
    [417, 208],
    [414, 211],
    [413, 224],
    [409, 229],
    [409, 235],
    [395, 261],
    [381, 278],
    [353, 301],
    [327, 314],
    [318, 315],
    [311, 319],
    [295, 320],
    [291, 323],
    [253, 323],
    [250, 320],
    [233, 319],
    [193, 302],
    [179, 290],
    [175, 289],
    [150, 261],
    [137, 237],
    [127, 201],
    [127, 104],
    [137, 96],
    [162, 95],
    [163, 55],
    [140, 54],
    [129, 49],
    [67, 50],
    [67, 96],
    [42, 138],
    [38, 153],
    [34, 158],
    [33, 167],
    [30, 170],
    [29, 183],
    [26, 186],
    [25, 207],
    [22, 211],
    [22, 253],
    [25, 257],
    [26, 278],
    [29, 282],
    [30, 294],
    [34, 300],
    [34, 307],
    [38, 312],
    [39, 320],
    [53, 347],
    [59, 353],
    [59, 356],
    [70, 372],
    [80, 382],
    [83, 389],
    [110, 414],
    [141, 435],
    [188, 457],
    [214, 462],
    [217, 465],
    [235, 466],
    [239, 469],
    [305, 469],
    [309, 466],
    [327, 465],
    [335, 461],
    [344, 461],
    [402, 436],
    [433, 415],
    [465, 385],
    [479, 367],
    [501, 330],
    [513, 299],
    [523, 246],
    [523, 136],
    [528, 132],
    [539, 130],
    [543, 124],
    [543, 26],
  ],
  path: [
    ["move", 540, 19],
    ["line", 411, 18],
    ["curve", 410, 18, 409, 19, 409, 20],
    ["line", 409, 129],
    ["curve", 409, 132, 418, 133, 418, 137],
    ["line", 418, 201],
    ["curve", 418, 228, 403, 253, 381, 278],
    ["curve", 354, 307, 320, 323, 291, 323],
    ["curve", 250, 324, 220, 315, 193, 302],
    ["curve", 160, 287, 136, 248, 127, 201],
    ["line", 127, 104],
    ["curve", 127, 99, 132, 96, 137, 96],
    ["line", 162, 95],
    ["line", 163, 55],
    ["curve", 150, 53, 141, 50, 129, 49],
    ["line", 67, 50],
    ["line", 67, 96],
    ["curve", 43, 135, 27, 179, 22, 211],
    ["line", 22, 253],
    ["curve", 24, 276, 30, 301, 39, 320],
    ["curve", 60, 365, 104, 412, 141, 435],
    ["curve", 184, 459, 228, 469, 272, 469],
    ["curve", 320, 470, 367, 454, 402, 436],
    ["curve", 451, 410, 492, 361, 513, 299],
    ["curve", 521, 274, 523, 246, 523, 215],
    ["line", 523, 136],
    ["curve", 528, 132, 539, 130, 543, 124],
    ["line", 543, 26],
    ["curve", 543, 22, 542, 20, 540, 19],
  ] satisfies readonly ExternalMicrometerReferencePathCommand[],
  groovePath: [
    ["move", 502, 190],
    ["curve", 504, 270, 480, 330, 450, 370],
    ["curve", 410, 420, 350, 450, 275, 453],
    ["curve", 190, 453, 120, 420, 75, 370],
    ["curve", 45, 330, 43, 270, 43, 190],
    ["curve", 44, 170, 55, 164, 70, 165],
    ["curve", 90, 165, 105, 180, 112, 210],
    ["curve", 125, 270, 165, 310, 210, 330],
    ["curve", 250, 343, 310, 338, 350, 320],
    ["curve", 400, 295, 427, 250, 437, 200],
    ["curve", 440, 175, 455, 165, 472, 165],
    ["curve", 490, 165, 500, 175, 502, 190],
  ] satisfies readonly ExternalMicrometerReferencePathCommand[],
} as const;

export const EXTERNAL_MICROMETER_CIRCULAR_FRAME_REFERENCE_RATIOS = {
  outerLeft: 0.18,
  outerRight: 5.52,
  outerTopFromAxis: -0.78,
  outerBottomFromAxis: 3.84,
  innerLeftCrown: 1.26,
  innerRightCrown: 4.14,
  innerBottomX: 2.94,
  innerBottomFromAxis: 2.34,
} as const;

export const EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS = {
  // Each upright uses the exact footprint of the component mounted above it.
  // This removes the offset shoulders that made both joints look detached.
  outerLeft: 0.66,
  outerRight: 5.52,
  leftTopFromAxis: 0.24,
  rightTopFromAxis: 0.7,
  outerBottomFromAxis: 3.78,
  outerCornerRadius: 0.52,
  innerLeft: 1.56,
  innerRight: 4.36,
  innerBottomFromAxis: 2.8,
  innerCornerRadius: 0.34,
  grooveLeft: 0.94,
  grooveRight: 4.94,
  grooveLeftTopFromAxis: 0.62,
  grooveRightTopFromAxis: 1.08,
  grooveBottomFromAxis: 3.48,
  grooveCornerRadius: 0.34,
  nameplateLeft: 1.73,
  nameplateTopFromAxis: 3.04,
  nameplateWidth: 2.72,
  nameplateHeight: 0.52,
  nameplateRadius: 0.13,
} as const;

export interface ExternalMicrometerGeometry {
  readonly B: number;
  readonly originX: number;
  readonly originY: number;
  readonly sceneRight: number;
  readonly sceneBottom: number;
  readonly axisY: number;
  readonly frameLeft: number;
  readonly frameRight: number;
  readonly frameBottom: number;
  readonly anvilFaceX: number;
  readonly spindleFaceX: number;
  readonly guideEntryX: number;
  readonly contactSpanPx: number;
  readonly pixelsPerMm: number;
  readonly bossLeft: number;
  readonly bossRight: number;
  readonly sleeveStartX: number;
  readonly zeroSeamX: number;
  readonly readingSeamX: number;
  readonly thimbleLeft: number;
  readonly thimbleConeRight: number;
  readonly gripLeft: number;
  readonly gripRight: number;
  readonly neckLeft: number;
  readonly neckRight: number;
  readonly ratchetLeft: number;
  readonly ratchetRight: number;
  readonly sleeveTop: number;
  readonly sleeveBottom: number;
  readonly thimbleTop: number;
  readonly thimbleBottom: number;
  readonly gripTop: number;
  readonly gripBottom: number;
  readonly referenceY: number;
  readonly thimbleDivision: number;
  readonly vernierDivision: number;
  readonly thimbleAngleDegrees: number;
  readonly hitLeft: number;
  readonly hitTop: number;
  readonly hitRight: number;
  readonly hitBottom: number;
}

export interface ExternalMicrometerVernierPresentation {
  readonly projectionScale: number;
  readonly stepPx: number;
  readonly screenStepPx: number;
  readonly fontPx: number;
  readonly screenFontPx: number;
  readonly labelInterval: 2 | 3 | 10;
  readonly topY: number;
  readonly bottomY: number;
}

/** Keeps all ten physical vernier marks inside the visible sleeve. */
export function getExternalMicrometerVernierPresentation(
  layout: ExternalMicrometerGeometry,
  projectionScale = 1,
): ExternalMicrometerVernierPresentation {
  const safeProjectionScale = Math.max(1, projectionScale);
  const effectiveBasePx = layout.B * safeProjectionScale;
  const minimumScreenFont = safeProjectionScale > 1 ? 14 : 9;
  const screenFontPx = Math.max(
    minimumScreenFont,
    Math.min(safeProjectionScale > 1 ? 17 : 11, effectiveBasePx * 0.11),
  );
  const fontPx = screenFontPx / safeProjectionScale;
  const clearance = Math.max(layout.B * 0.055, fontPx * 0.5 + layout.B * 0.02);
  const usableHeight = Math.max(
    layout.B * 0.36,
    layout.referenceY - layout.sleeveTop - clearance,
  );
  const stepPx = usableHeight / 9;
  const screenStepPx = stepPx * safeProjectionScale;
  const labelInterval = screenStepPx * 2 >= screenFontPx + 2
    ? 2
    : screenStepPx * 3 >= screenFontPx + 2
      ? 3
      : 10;

  return {
    projectionScale: safeProjectionScale,
    stepPx,
    screenStepPx,
    fontPx,
    screenFontPx,
    labelInterval,
    topY: layout.referenceY - stepPx * 9,
    bottomY: layout.referenceY,
  };
}

export function getExternalMicrometerGeometry(
  width: number,
  height: number,
  ticks: number,
): ExternalMicrometerGeometry {
  const r = EXTERNAL_MICROMETER_GEOMETRY_RATIOS;
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const B = Math.max(
    1,
    Math.min(safeWidth / r.sceneWidth, safeHeight / r.sceneHeight),
  );
  const sceneWidth = r.sceneWidth * B;
  const sceneHeight = r.sceneHeight * B;
  const originX = Math.max(0, (safeWidth - sceneWidth) / 2);
  const originY = Math.max(0, (safeHeight - sceneHeight) / 2);
  const snapped = snapExternalMicrometerTicks(ticks);
  const millimetres = snapped / EXTERNAL_MICROMETER_TICKS_PER_MM;
  const pixelsPerMm = r.contactPixelsPerMm * B;
  const travelPx = millimetres * pixelsPerMm;
  const axisY = originY + r.axisY * B;
  const frameLeft = originX + r.frameLeft * B;
  const frameRight = originX + r.frameRight * B;
  const frameBottom = originY + r.frameBottom * B;
  const anvilFaceX = originX + r.anvilFaceX * B;
  const spindleFaceX = anvilFaceX + travelPx;
  const guideEntryX = originX + r.guideEntryX * B;
  const bossLeft = originX + r.bossLeft * B;
  const bossRight = originX + r.bossRight * B;
  const sleeveStartX = originX + r.sleeveStartX * B;
  const zeroSeamX = originX + r.zeroSeamX * B;
  const readingSeamX = zeroSeamX + travelPx;
  const thimbleLeft =
    readingSeamX +
    (EXTERNAL_MICROMETER_OPTICAL_SEAM_OFFSET_TICKS /
      EXTERNAL_MICROMETER_TICKS_PER_MM) *
      pixelsPerMm;
  const thimbleConeRight = thimbleLeft + r.thimbleConeLength * B;
  const gripLeft = thimbleConeRight;
  const gripRight = gripLeft + r.gripLength * B;
  const neckLeft = gripRight;
  const neckRight = neckLeft + r.neckLength * B;
  const ratchetLeft = neckRight;
  const ratchetRight = ratchetLeft + r.ratchetLength * B;
  const reading = decomposeExternalMicrometerReading(snapped);
  const sleeveRadius = 0.62 * B;
  const thimbleRadius = 0.82 * B;
  const gripRadius = 0.78 * B;

  return {
    B,
    originX,
    originY,
    sceneRight: originX + sceneWidth,
    sceneBottom: originY + sceneHeight,
    axisY,
    frameLeft,
    frameRight,
    frameBottom,
    anvilFaceX,
    spindleFaceX,
    guideEntryX,
    contactSpanPx: spindleFaceX - anvilFaceX,
    pixelsPerMm,
    bossLeft,
    bossRight,
    sleeveStartX,
    zeroSeamX,
    readingSeamX,
    thimbleLeft,
    thimbleConeRight,
    gripLeft,
    gripRight,
    neckLeft,
    neckRight,
    ratchetLeft,
    ratchetRight,
    sleeveTop: axisY - sleeveRadius,
    sleeveBottom: axisY + sleeveRadius,
    thimbleTop: axisY - thimbleRadius,
    thimbleBottom: axisY + thimbleRadius,
    gripTop: axisY - gripRadius,
    gripBottom: axisY + gripRadius,
    referenceY: axisY,
    thimbleDivision: reading.thimbleDivision,
    vernierDivision: reading.vernierDivision,
    thimbleAngleDegrees:
      (reading.phaseTicks * 360) / EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
    hitLeft: thimbleLeft - B * 0.16,
    hitTop: axisY - thimbleRadius - B * 0.18,
    hitRight: ratchetRight + B * 0.08,
    hitBottom: axisY + thimbleRadius + B * 0.18,
  };
}

export function getExternalMicrometerScaleMarkX(
  layout: Pick<
    ExternalMicrometerGeometry,
    "zeroSeamX" | "pixelsPerMm"
  >,
  markTicks: number,
): number {
  return (
    layout.zeroSeamX +
    (markTicks / EXTERNAL_MICROMETER_TICKS_PER_MM) * layout.pixelsPerMm
  );
}

export function getExternalMicrometerScaleLabelPresentation(
  layout: Pick<ExternalMicrometerGeometry, "zeroSeamX" | "pixelsPerMm">,
  markTicks: number,
): { readonly x: number; readonly textAlign: "center" } {
  return {
    x: getExternalMicrometerScaleMarkX(layout, markTicks),
    textAlign: "center",
  };
}

export function isExternalMicrometerScaleMarkExposed(
  layout: Pick<
    ExternalMicrometerGeometry,
    "B" | "zeroSeamX" | "pixelsPerMm" | "readingSeamX"
  >,
  markTicks: number,
): boolean {
  const markX = getExternalMicrometerScaleMarkX(layout, markTicks);
  return markX <= layout.readingSeamX + layout.B * 1e-9;
}

export function isExternalMicrometerWholeMarkAtSeam(ticks: number): boolean {
  const snapped = snapExternalMicrometerTicks(ticks);
  return snapped % EXTERNAL_MICROMETER_TICKS_PER_MM === 0;
}

export function getExternalMicrometerProgress(ticks: number): number {
  return snapExternalMicrometerTicks(ticks) / EXTERNAL_MICROMETER_MAX_TICKS;
}

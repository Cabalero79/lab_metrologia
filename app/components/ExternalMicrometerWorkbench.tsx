"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID,
  EXTERNAL_MICROMETER_MAX_TICKS,
  EXTERNAL_MICROMETER_MIN_TICKS,
  EXTERNAL_MICROMETER_PROFILE_IDS,
  EXTERNAL_MICROMETER_PROFILES,
  EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  EXTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeExternalMicrometerReading,
  externalMicrometerTicksToMm,
  formatExternalMicrometerBreakdown,
  formatExternalMicrometerInches,
  formatExternalMicrometerReading,
  snapExternalMicrometerTicks,
  type ExternalMicrometerProfileId,
} from "../../lib/external-micrometer";
import {
  EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS,
  getExternalMicrometerGeometry,
  getExternalMicrometerScaleLabelPresentation,
  getExternalMicrometerScaleMarkX,
  getExternalMicrometerVernierPresentation,
  isExternalMicrometerScaleMarkExposed,
  isExternalMicrometerWholeMarkAtSeam,
  type ExternalMicrometerGeometry,
} from "../../lib/external-micrometer-geometry";
import { getExternalMicrometerDragTicks } from "../../lib/external-micrometer-interaction";
import { InstrumentSelector } from "./InstrumentSelector";
import type { InstrumentNavigationProps } from "./instrument-types";

const INITIAL_EXTERNAL_MICROMETER_TICKS = 10_000;

export interface ExternalMicrometerSessionState {
  readonly ticks: number;
  readonly profileId: ExternalMicrometerProfileId;
  readonly answerVisible: boolean;
  readonly scaleNumbersVisible: boolean;
}

interface ExternalMicrometerWorkbenchProps extends InstrumentNavigationProps {
  readonly initialSession?: ExternalMicrometerSessionState;
  readonly onSessionChange?: (session: ExternalMicrometerSessionState) => void;
}

interface DetailViewport {
  readonly zoom: number;
  readonly focusX: number;
  readonly focusY: number;
  readonly targetX: number;
  readonly targetY: number;
}

function getDetailViewport(
  width: number,
  height: number,
  layout: ExternalMicrometerGeometry,
): DetailViewport {
  const sourceWidth = layout.B * 4.5;
  const overviewVernier = getExternalMicrometerVernierPresentation(layout, 1);
  const minimumVernierZoom =
    16 / Math.max(0.1, overviewVernier.stepPx * 3);
  return {
    zoom: Math.min(
      6,
      Math.max(1.75, (width * 0.78) / sourceWidth, minimumVernierZoom),
    ),
    focusX: layout.thimbleLeft + layout.B * 0.28,
    focusY: layout.referenceY,
    targetX: width * 0.5,
    targetY: height * 0.52,
  };
}

function isPointOnMovingAssembly(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  ticks: number,
  detailMode: boolean,
): boolean {
  const layout = getExternalMicrometerGeometry(rect.width, rect.height, ticks);
  let x = clientX - rect.left;
  let y = clientY - rect.top;
  const viewport = detailMode
    ? getDetailViewport(rect.width, rect.height, layout)
    : null;
  if (viewport) {
    x = (x - viewport.targetX) / viewport.zoom + viewport.focusX;
    y = (y - viewport.targetY) / viewport.zoom + viewport.focusY;
  }
  return (
    x >= layout.hitLeft &&
    x <= layout.hitRight &&
    y >= layout.hitTop &&
    y <= layout.hitBottom
  );
}

function drawHorizontalArrowHead(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: -1 | 1,
  size: number,
) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + direction * size, y - size);
  context.lineTo(x + direction * size, y + size);
  context.closePath();
  context.fill();
}

function getFramePath(layout: ExternalMicrometerGeometry): Path2D {
  const { B, axisY, originX } = layout;
  const frame = EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS;
  const x = (ratio: number) => originX + ratio * B;
  const y = (ratio: number) => axisY + ratio * B;
  const path = new Path2D();

  path.moveTo(x(frame.outerLeft), y(frame.leftTopFromAxis));
  path.lineTo(
    x(frame.outerLeft),
    y(frame.outerBottomFromAxis - frame.outerCornerRadius),
  );
  path.quadraticCurveTo(
    x(frame.outerLeft),
    y(frame.outerBottomFromAxis),
    x(frame.outerLeft + frame.outerCornerRadius),
    y(frame.outerBottomFromAxis),
  );
  path.lineTo(
    x(frame.outerRight - frame.outerCornerRadius),
    y(frame.outerBottomFromAxis),
  );
  path.quadraticCurveTo(
    x(frame.outerRight),
    y(frame.outerBottomFromAxis),
    x(frame.outerRight),
    y(frame.outerBottomFromAxis - frame.outerCornerRadius),
  );
  path.lineTo(x(frame.outerRight), y(frame.rightTopFromAxis));
  path.lineTo(x(frame.innerRight), y(frame.rightTopFromAxis));
  path.lineTo(
    x(frame.innerRight),
    y(frame.innerBottomFromAxis - frame.innerCornerRadius),
  );
  path.quadraticCurveTo(
    x(frame.innerRight),
    y(frame.innerBottomFromAxis),
    x(frame.innerRight - frame.innerCornerRadius),
    y(frame.innerBottomFromAxis),
  );
  path.lineTo(
    x(frame.innerLeft + frame.innerCornerRadius),
    y(frame.innerBottomFromAxis),
  );
  path.quadraticCurveTo(
    x(frame.innerLeft),
    y(frame.innerBottomFromAxis),
    x(frame.innerLeft),
    y(frame.innerBottomFromAxis - frame.innerCornerRadius),
  );
  path.lineTo(x(frame.innerLeft), y(frame.leftTopFromAxis));
  path.closePath();
  return path;
}

function getFrameGroovePath(layout: ExternalMicrometerGeometry): Path2D {
  const { B, axisY, originX } = layout;
  const frame = EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS;
  const x = (ratio: number) => originX + ratio * B;
  const y = (ratio: number) => axisY + ratio * B;
  const path = new Path2D();

  path.moveTo(x(frame.grooveLeft), y(frame.grooveLeftTopFromAxis));
  path.lineTo(
    x(frame.grooveLeft),
    y(frame.grooveBottomFromAxis - frame.grooveCornerRadius),
  );
  path.quadraticCurveTo(
    x(frame.grooveLeft),
    y(frame.grooveBottomFromAxis),
    x(frame.grooveLeft + frame.grooveCornerRadius),
    y(frame.grooveBottomFromAxis),
  );
  path.lineTo(
    x(frame.grooveRight - frame.grooveCornerRadius),
    y(frame.grooveBottomFromAxis),
  );
  path.quadraticCurveTo(
    x(frame.grooveRight),
    y(frame.grooveBottomFromAxis),
    x(frame.grooveRight),
    y(frame.grooveBottomFromAxis - frame.grooveCornerRadius),
  );
  path.lineTo(x(frame.grooveRight), y(frame.grooveRightTopFromAxis));
  return path;
}

function getFrameNameplatePath(layout: ExternalMicrometerGeometry): Path2D {
  const { B, axisY, originX } = layout;
  const frame = EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS;
  const path = new Path2D();
  path.roundRect(
    originX + B * frame.nameplateLeft,
    axisY + B * frame.nameplateTopFromAxis,
    B * frame.nameplateWidth,
    B * frame.nameplateHeight,
    B * frame.nameplateRadius,
  );
  return path;
}

function drawKnurl(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  right: number,
  bottom: number,
  B: number,
  color: string,
  highlighted: boolean,
) {
  context.save();
  context.beginPath();
  context.rect(left, top, right - left, bottom - top);
  context.clip();
  context.strokeStyle = highlighted ? "#7c2145" : color;
  context.globalAlpha = highlighted ? 0.9 : 0.56;
  context.lineWidth = highlighted
    ? Math.max(1.1, B * 0.017)
    : Math.max(0.55, B * 0.007);
  for (let x = left - B * 0.45; x < right; x += B * 0.07) {
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x + B * 0.5, bottom);
    context.stroke();
    context.beginPath();
    context.moveTo(x, bottom);
    context.lineTo(x + B * 0.5, top);
    context.stroke();
  }
  context.restore();
}

function drawScaleText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  context.save();
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.restore();
}

function drawExternalMicrometer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  ticks: number,
  dragging: boolean,
  detailMode: boolean,
  readingLabel: string,
  answerVisible: boolean,
  scaleNumbersVisible: boolean,
  profileId: ExternalMicrometerProfileId,
) {
  const layout = getExternalMicrometerGeometry(width, height, ticks);
  const {
    B,
    axisY,
    anvilFaceX,
    spindleFaceX,
    guideEntryX,
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
    sleeveTop,
    sleeveBottom,
    thimbleTop,
    thimbleBottom,
    gripTop,
    gripBottom,
    referenceY,
    vernierDivision,
  } = layout;
  const profile = EXTERNAL_MICROMETER_PROFILES[profileId];
  const reading = decomposeExternalMicrometerReading(ticks);
  const metalLight = "#eeeeec";
  const metal = "#c8c8c6";
  const metalMid = "#aaa9a7";
  const metalDark = "#6f6e6d";
  const frameDark = "#4f504e";
  const frameMid = "#858683";
  const ink = "#181619";
  const accent = "#7c2145";
  const outlineWidth = Math.max(1.2, B * 0.018);

  context.clearRect(0, 0, width, height);
  context.save();
  const viewport = detailMode ? getDetailViewport(width, height, layout) : null;
  const projectionScale = viewport?.zoom ?? 1;
  if (viewport) {
    context.translate(viewport.targetX, viewport.targetY);
    context.scale(viewport.zoom, viewport.zoom);
    context.translate(-viewport.focusX, -viewport.focusY);
  }
  context.lineJoin = "round";
  context.lineCap = "square";
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;

  const frame = getFramePath(layout);
  const frameGradient = context.createLinearGradient(
    layout.frameLeft,
    axisY,
    bossRight,
    layout.frameBottom,
  );
  frameGradient.addColorStop(0, frameDark);
  frameGradient.addColorStop(0.48, frameMid);
  frameGradient.addColorStop(1, "#626360");
  context.fillStyle = frameGradient;
  context.fill(frame, "evenodd");
  context.strokeStyle = ink;
  context.stroke(frame);

  context.save();
  context.clip(frame, "evenodd");
  context.globalAlpha = 0.13;
  context.fillStyle = metalLight;
  for (let index = 0; index < 84; index += 1) {
    const px = layout.frameLeft + ((index * 47) % 405) * (B / 90);
    const py = axisY - B * 0.55 + ((index * 83) % 480) * (B / 90);
    context.beginPath();
    context.arc(px, py, Math.max(0.45, B * 0.012), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  // The recessed rib follows the squared frame but stops below both terminal
  // components, preserving the fixed stop and the circular lock housing.
  const frameGroove = getFrameGroovePath(layout);
  context.strokeStyle = ink;
  context.globalAlpha = 0.38;
  context.lineWidth = Math.max(outlineWidth * 2.4, B * 0.065);
  context.stroke(frameGroove);
  context.strokeStyle = metalLight;
  context.globalAlpha = 0.46;
  context.lineWidth = Math.max(outlineWidth, B * 0.028);
  context.stroke(frameGroove);
  context.globalAlpha = 1;

  const bodyGradient = context.createLinearGradient(0, axisY - B, 0, axisY + B);
  bodyGradient.addColorStop(0, metalDark);
  bodyGradient.addColorStop(0.18, metalLight);
  bodyGradient.addColorStop(0.52, metal);
  bodyGradient.addColorStop(0.84, metalLight);
  bodyGradient.addColorStop(1, metalDark);

  // Fixed anvil, including the bright carbide insert at the contact face.
  const anvilLeft = layout.originX + B * 0.66;
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.roundRect(
    anvilLeft,
    axisY - B * 0.24,
    anvilFaceX - anvilLeft,
    B * 0.48,
    B * 0.08,
  );
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke();
  context.fillStyle = metalLight;
  context.fillRect(anvilFaceX - B * 0.14, axisY - B * 0.22, B * 0.14, B * 0.44);
  context.strokeRect(anvilFaceX - B * 0.14, axisY - B * 0.22, B * 0.14, B * 0.44);

  // Moving spindle remains coaxial with the fixed anvil through the full range.
  const spindleWidth = Math.max(0, guideEntryX - spindleFaceX + B * 0.08);
  context.fillStyle = bodyGradient;
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.fillRect(spindleFaceX, axisY - B * 0.16, spindleWidth, B * 0.32);
  context.strokeRect(spindleFaceX, axisY - B * 0.16, spindleWidth, B * 0.32);
  context.fillStyle = metalLight;
  context.fillRect(spindleFaceX, axisY - B * 0.2, B * 0.08, B * 0.4);
  context.strokeRect(spindleFaceX, axisY - B * 0.2, B * 0.08, B * 0.4);

  // Frame boss and lock lever are distinct reference volumes.
  context.fillStyle = frameGradient;
  context.beginPath();
  context.roundRect(
    bossLeft,
    axisY - B * 0.68,
    bossRight - bossLeft,
    B * 1.38,
    B * 0.15,
  );
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke();

  // The bore remains visible through the frame boss, so the spindle is never
  // mistaken for a rod that disappears behind a solid jaw.
  const boreLeft = Math.max(spindleFaceX, bossLeft - B * 0.04);
  context.fillStyle = bodyGradient;
  context.fillRect(
    boreLeft,
    axisY - B * 0.15,
    Math.max(B * 0.08, guideEntryX + B * 0.08 - boreLeft),
    B * 0.3,
  );
  context.strokeStyle = ink;
  context.strokeRect(
    boreLeft,
    axisY - B * 0.15,
    Math.max(B * 0.08, guideEntryX + B * 0.08 - boreLeft),
    B * 0.3,
  );
  if (spindleFaceX >= bossLeft - B * 0.04) {
    context.fillStyle = metalLight;
    context.fillRect(spindleFaceX, axisY - B * 0.2, B * 0.08, B * 0.4);
    context.strokeRect(spindleFaceX, axisY - B * 0.2, B * 0.08, B * 0.4);
  }

  const pivotX = bossLeft + B * 0.46;
  context.fillStyle = metalMid;
  context.beginPath();
  context.arc(pivotX, axisY - B * 0.04, B * 0.38, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = ink;
  context.beginPath();
  context.arc(pivotX, axisY - B * 0.04, B * 0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = metalLight;
  context.beginPath();
  context.arc(pivotX, axisY - B * 0.04, B * 0.09, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.translate(pivotX + B * 0.1, axisY + B * 0.19);
  context.rotate(0.18);
  context.fillStyle = metalMid;
  context.beginPath();
  context.roundRect(-B * 0.12, 0, B * 0.24, B * 0.86, B * 0.1);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke();
  context.restore();

  // Fixed sleeve is drawn in full, then the moving thimble occludes it.
  const sleeveRight = zeroSeamX + B * 2.7;
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.roundRect(
    sleeveStartX,
    sleeveTop,
    sleeveRight - sleeveStartX,
    sleeveBottom - sleeveTop,
    B * 0.12,
  );
  context.fill();
  context.strokeStyle = ink;
  context.stroke();

  context.save();
  context.beginPath();
  context.rect(
    sleeveStartX,
    sleeveTop,
    Math.max(1, thimbleLeft - sleeveStartX),
    sleeveBottom - sleeveTop,
  );
  context.clip();
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = Math.max(0.85, B * 0.014);
  context.beginPath();
  const sleeveScaleY = referenceY + B * 0.2;
  const sleeveNumberFontSize = Math.max(6, B * 0.16);
  const sleeveNumberBottomY = sleeveBottom - B * 0.05;
  const sleeveNumberGap = Math.max(1, B * 0.03);
  const sleeveNumberIntervalTicks = B < 32 ? 10_000 : 5_000;
  const wholeScaleLength = Math.max(
    0.75,
    Math.min(
      B * 0.17,
      sleeveNumberBottomY -
        sleeveNumberFontSize -
        sleeveNumberGap -
        sleeveScaleY,
    ),
  );
  context.moveTo(sleeveStartX, sleeveScaleY);
  context.lineTo(sleeveRight, sleeveScaleY);
  context.stroke();
  for (let markTicks = 0; markTicks <= 25_000; markTicks += 500) {
    const x = getExternalMicrometerScaleMarkX(layout, markTicks);
    const whole = markTicks % 1_000 === 0;
    const direction = whole ? 1 : -1;
    const length = whole ? wholeScaleLength : B * 0.13;
    context.beginPath();
    context.moveTo(x, sleeveScaleY);
    context.lineTo(x, sleeveScaleY + direction * length);
    context.stroke();
    const numberedMark =
      markTicks % sleeveNumberIntervalTicks === 0 ||
      markTicks === EXTERNAL_MICROMETER_MAX_TICKS;
    if (
      whole &&
      numberedMark &&
      scaleNumbersVisible &&
      isExternalMicrometerScaleMarkExposed(layout, markTicks)
    ) {
      const labelPresentation = getExternalMicrometerScaleLabelPresentation(
        layout,
        markTicks,
      );
      context.font = `760 ${sleeveNumberFontSize}px Arial, sans-serif`;
      context.textAlign = labelPresentation.textAlign;
      context.textBaseline = "bottom";
      drawScaleText(
        context,
        String(markTicks / EXTERNAL_MICROMETER_TICKS_PER_MM),
        labelPresentation.x,
        sleeveNumberBottomY,
        ink,
      );
    }
  }

  // Ten-line vernier above the datum. The aligned thousandth is highlighted.
  const thimbleStep = Math.max(B * 0.092, 5.2);
  const vernierPresentation = getExternalMicrometerVernierPresentation(
    layout,
    projectionScale,
  );
  const vernierRight = thimbleLeft - B * 0.04;
  const vernierLeft = Math.max(sleeveStartX + B * 0.18, vernierRight - B * 0.84);
  if (profile.vernierDivisions > 0) {
    for (let division = 0; division < 10; division += 1) {
      const y = referenceY - division * vernierPresentation.stepPx;
      const aligned = division === vernierDivision;
      context.strokeStyle = aligned ? accent : ink;
      context.lineWidth = aligned
        ? Math.max(1.2, B * 0.02)
        : Math.max(0.8, B * 0.012);
      context.beginPath();
      context.moveTo(vernierLeft, y);
      context.lineTo(vernierRight, y);
      context.stroke();
      if (
        division % vernierPresentation.labelInterval === 0 &&
        scaleNumbersVisible
      ) {
        context.font = `740 ${vernierPresentation.fontPx}px Arial, sans-serif`;
        context.textAlign = "right";
        context.textBaseline = "middle";
        drawScaleText(
          context,
          String(division),
          vernierLeft - B * 0.07,
          y,
          aligned ? accent : ink,
        );
      }
    }
  }
  context.restore();

  // Tapered graduated thimble.
  const thimbleGradient = context.createLinearGradient(0, thimbleTop, 0, thimbleBottom);
  thimbleGradient.addColorStop(0, metalDark);
  thimbleGradient.addColorStop(0.14, metalLight);
  thimbleGradient.addColorStop(0.48, metal);
  thimbleGradient.addColorStop(0.84, metalLight);
  thimbleGradient.addColorStop(1, metalDark);
  const thimble = new Path2D();
  thimble.moveTo(thimbleLeft, sleeveTop - B * 0.05);
  thimble.lineTo(thimbleLeft + B * 0.72, thimbleTop);
  thimble.lineTo(thimbleConeRight, thimbleTop);
  thimble.lineTo(thimbleConeRight, thimbleBottom);
  thimble.lineTo(thimbleLeft + B * 0.72, thimbleBottom);
  thimble.lineTo(thimbleLeft, sleeveBottom + B * 0.05);
  thimble.closePath();
  context.fillStyle = thimbleGradient;
  context.fill(thimble);
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke(thimble);

  // At exact whole millimetres the sleeve graduation and the exact reading
  // datum coincide. Redraw that segment after the optically preloaded thimble
  // shell so the moving body cannot visually erase the physical graduation.
  if (isExternalMicrometerWholeMarkAtSeam(reading.totalTicks)) {
    const seamGraduationBottom = sleeveScaleY + wholeScaleLength;
    context.save();
    context.strokeStyle = metalLight;
    context.lineWidth = outlineWidth + Math.max(1.4, B * 0.022);
    context.beginPath();
    context.moveTo(readingSeamX, sleeveScaleY);
    context.lineTo(readingSeamX, seamGraduationBottom);
    context.stroke();
    context.strokeStyle = ink;
    context.lineWidth = Math.max(0.85, B * 0.014);
    context.beginPath();
    context.moveTo(readingSeamX, sleeveScaleY);
    context.lineTo(readingSeamX, seamGraduationBottom);
    context.stroke();
    context.restore();
  }

  context.save();
  context.clip(thimble);
  const phaseDivision = reading.phaseTicks / 10;
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = Math.max(0.8, B * 0.013);
  for (let division = 0; division < 50; division += 1) {
    let offset = division - phaseDivision;
    if (offset > 25) offset -= 50;
    if (offset < -25) offset += 50;
    if (Math.abs(offset) > 8) continue;
    const y = referenceY + offset * thimbleStep;
    const major = division % 5 === 0;
    const length = major ? B * 0.48 : B * 0.3;
    context.beginPath();
    context.moveTo(thimbleLeft, y);
    context.lineTo(thimbleLeft + length, y);
    context.stroke();
    if (major && scaleNumbersVisible) {
      context.font = `760 ${Math.max(10, B * 0.185)}px Arial, sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      drawScaleText(
        context,
        String(division),
        thimbleLeft + length + B * 0.08,
        y,
        ink,
      );
    }
  }
  context.strokeStyle = accent;
  context.lineWidth = Math.max(1.15, B * 0.019);
  context.beginPath();
  context.moveTo(thimbleLeft - B * 0.06, referenceY);
  context.lineTo(thimbleLeft + B * 0.88, referenceY);
  context.stroke();
  context.restore();

  // Main grip, neck and terminal ratchet remain separate volumes.
  const gripGradient = context.createLinearGradient(0, gripTop, 0, gripBottom);
  gripGradient.addColorStop(0, metalDark);
  gripGradient.addColorStop(0.12, metalLight);
  gripGradient.addColorStop(0.5, metalMid);
  gripGradient.addColorStop(0.88, metalLight);
  gripGradient.addColorStop(1, metalDark);
  context.fillStyle = gripGradient;
  context.beginPath();
  context.roundRect(
    gripLeft,
    gripTop,
    gripRight - gripLeft,
    gripBottom - gripTop,
    B * 0.08,
  );
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke();
  drawKnurl(context, gripLeft, gripTop, gripRight, gripBottom, B, ink, dragging);

  const neckGradient = context.createLinearGradient(neckLeft, 0, neckRight, 0);
  neckGradient.addColorStop(0, metalDark);
  neckGradient.addColorStop(0.5, metalLight);
  neckGradient.addColorStop(1, metalDark);
  context.fillStyle = neckGradient;
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.fillRect(neckLeft, axisY - B * 0.48, neckRight - neckLeft, B * 0.96);
  context.strokeRect(neckLeft, axisY - B * 0.48, neckRight - neckLeft, B * 0.96);

  const ratchetGradient = context.createLinearGradient(ratchetLeft, 0, ratchetRight, 0);
  ratchetGradient.addColorStop(0, metalDark);
  ratchetGradient.addColorStop(0.5, metalLight);
  ratchetGradient.addColorStop(1, metalDark);
  const ratchetTop = axisY - B * 0.58;
  const ratchetBottom = axisY + B * 0.58;
  context.fillStyle = ratchetGradient;
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.beginPath();
  context.roundRect(
    ratchetLeft,
    ratchetTop,
    ratchetRight - ratchetLeft,
    ratchetBottom - ratchetTop,
    B * 0.1,
  );
  context.fill();
  context.stroke();
  drawKnurl(
    context,
    ratchetLeft,
    ratchetTop,
    ratchetRight,
    ratchetBottom,
    B,
    ink,
    false,
  );

  // The identification insert follows the same square-with-rounded-corners
  // language as the frame base. It remains recessed and free of rivets.
  const nameplate = getFrameNameplatePath(layout);
  const squareFrame = EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS;
  const nameplateLeft =
    layout.originX + B * squareFrame.nameplateLeft;
  const nameplateTop =
    axisY + B * squareFrame.nameplateTopFromAxis;
  const nameplateGradient = context.createLinearGradient(
    nameplateLeft,
    nameplateTop,
    nameplateLeft + B * squareFrame.nameplateWidth,
    nameplateTop + B * squareFrame.nameplateHeight,
  );
  nameplateGradient.addColorStop(0, "#252627");
  nameplateGradient.addColorStop(0.58, "#343638");
  nameplateGradient.addColorStop(1, "#4b4d4e");
  context.save();
  context.clip(frame, "evenodd");
  context.fillStyle = nameplateGradient;
  context.fill(nameplate);
  context.strokeStyle = ink;
  context.lineWidth = outlineWidth;
  context.stroke(nameplate);
  context.globalAlpha = 0.34;
  context.strokeStyle = metalLight;
  context.lineWidth = Math.max(0.7, B * 0.009);
  context.beginPath();
  context.moveTo(nameplateLeft + B * 0.18, nameplateTop + B * 0.08);
  context.lineTo(
    nameplateLeft + B * (squareFrame.nameplateWidth - 0.18),
    nameplateTop + B * 0.08,
  );
  context.stroke();
  context.globalAlpha = 1;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(18, 18, 17, 0.72)";
  context.shadowBlur = Math.max(0.8, B * 0.016);
  context.shadowOffsetY = Math.max(0.6, B * 0.01);
  context.fillStyle = metalLight;
  context.font = `780 ${Math.max(8, B * 0.165)}px Arial, sans-serif`;
  context.fillText(
    "CABALERO",
    nameplateLeft + B * 0.24,
    nameplateTop + B * 0.2,
  );
  context.shadowBlur = Math.max(0.5, B * 0.01);
  context.fillStyle = "rgba(238, 238, 236, 0.88)";
  context.font = `650 ${Math.max(6, B * 0.095)}px Arial, sans-serif`;
  context.fillText(
    `0–25 mm · ${profile.shortLabel} mm`,
    nameplateLeft + B * 0.24,
    nameplateTop + B * 0.39,
  );
  context.shadowColor = "transparent";
  context.restore();

  // Didactic dimension shares the exact two contact datums.
  const dimensionY = axisY - B * 0.62;
  const span = spindleFaceX - anvilFaceX;
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineWidth = Math.max(1.1, B * 0.018);
  context.beginPath();
  context.moveTo(anvilFaceX, axisY - B * 0.28);
  context.lineTo(anvilFaceX, dimensionY);
  context.moveTo(spindleFaceX, axisY - B * 0.28);
  context.lineTo(spindleFaceX, dimensionY);
  if (span > B * 0.34) {
    context.moveTo(anvilFaceX, dimensionY);
    context.lineTo(spindleFaceX, dimensionY);
  }
  context.stroke();
  if (span > B * 0.34) {
    drawHorizontalArrowHead(context, anvilFaceX, dimensionY, 1, Math.max(3, B * 0.07));
    drawHorizontalArrowHead(context, spindleFaceX, dimensionY, -1, Math.max(3, B * 0.07));
  }
  const label = answerVisible ? readingLabel.replace(/\s+mm$/u, "") : "?";
  const labelX = span > B * 0.72
    ? (anvilFaceX + spindleFaceX) / 2
    : anvilFaceX + B * 0.52;
  context.font = `650 ${Math.max(11, B * 0.2)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(3, B * 0.065);
  context.strokeText(label, labelX, dimensionY - B * 0.2);
  context.fillStyle = ink;
  context.fillText(label, labelX, dimensionY - B * 0.2);
  context.restore();
}

export function ExternalMicrometerWorkbench({
  activeInstrument,
  onInstrumentChange,
  initialSession,
  onSessionChange,
}: ExternalMicrometerWorkbenchProps) {
  const initialProfileId =
    initialSession?.profileId ?? DEFAULT_EXTERNAL_MICROMETER_PROFILE_ID;
  const [profileId, setProfileId] =
    useState<ExternalMicrometerProfileId>(initialProfileId);
  const profile = EXTERNAL_MICROMETER_PROFILES[profileId];
  const [ticks, setTicks] = useState(() =>
    snapExternalMicrometerTicks(
      initialSession?.ticks ?? INITIAL_EXTERNAL_MICROMETER_TICKS,
      initialProfileId,
    ),
  );
  const [answerVisible, setAnswerVisible] = useState(
    initialSession?.answerVisible ?? true,
  );
  const [scaleNumbersVisible, setScaleNumbersVisible] = useState(
    initialSession?.scaleNumbersVisible ?? true,
  );
  const [dragging, setDragging] = useState(false);
  const [movingAssemblyHovered, setMovingAssemblyHovered] = useState(false);
  const [detailMode, setDetailMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detailButtonRef = useRef<HTMLButtonElement>(null);
  const labRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const dragOriginRef = useRef<{
    clientX: number;
    ticks: number;
    ticksPerCssPixel: number;
  } | null>(null);
  const reading = formatExternalMicrometerReading(ticks, true, profileId);
  const decomposition = decomposeExternalMicrometerReading(ticks);
  const breakdown = formatExternalMicrometerBreakdown(decomposition, profileId);
  const compactBreakdown = breakdown.replaceAll(" mm +", " +");
  const convertedReading = formatExternalMicrometerInches(ticks, profileId);

  useEffect(() => {
    onSessionChange?.({ ticks, profileId, answerVisible, scaleNumbersVisible });
  }, [answerVisible, onSessionChange, profileId, scaleNumbersVisible, ticks]);

  const setReading = useCallback(
    (candidateTicks: number) => {
      setTicks(snapExternalMicrometerTicks(candidateTicks, profileId));
    },
    [profileId],
  );

  const changeProfile = (nextProfileId: ExternalMicrometerProfileId) => {
    const nextProfile = EXTERNAL_MICROMETER_PROFILES[nextProfileId];
    setProfileId(nextProfileId);
    setTicks((currentTicks) =>
      snapExternalMicrometerTicks(currentTicks, nextProfileId),
    );
    setAnnouncement(
      `Resolução ${nextProfile.description} selecionada: ${nextProfile.label}.`,
    );
    window.requestAnimationFrame(() => canvasRef.current?.focus());
  };

  const cancelPointer = useCallback(() => {
    activePointerRef.current = null;
    dragOriginRef.current = null;
    setDragging(false);
    setMovingAssemblyHovered(false);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailMode(false);
    setAnnouncement("Ampliação fechada. Visualização geral restaurada.");
    window.requestAnimationFrame(() => detailButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === labRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onWindowBlur = () => cancelPointer();
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") cancelPointer();
    };
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cancelPointer]);

  useEffect(() => {
    if (!detailMode) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDetail();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [closeDetail, detailMode]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.max(1, Math.round(rect.width * ratio));
      const targetHeight = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== targetWidth) canvas.width = targetWidth;
      if (canvas.height !== targetHeight) canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawExternalMicrometer(
        context,
        rect.width,
        rect.height,
        ticks,
        dragging,
        detailMode,
        reading,
        answerVisible,
        scaleNumbersVisible,
        profileId,
      );
    };
    render();
    let resizeFrame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(render);
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(resizeFrame);
    };
  }, [
    answerVisible,
    detailMode,
    dragging,
    profileId,
    reading,
    scaleNumbersVisible,
    ticks,
  ]);

  const pointerIsOnMovingAssembly = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return isPointOnMovingAssembly(
      event.clientX,
      event.clientY,
      rect,
      ticks,
      detailMode,
    );
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      event.button !== 0 ||
      activePointerRef.current !== null ||
      !pointerIsOnMovingAssembly(event)
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    dragOriginRef.current = {
      clientX: event.clientX,
      ticks,
      ticksPerCssPixel: profile.resolutionTicks,
    };
    setDragging(true);
    setMovingAssemblyHovered(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      const origin = dragOriginRef.current;
      if (!origin) return;
      setReading(
        getExternalMicrometerDragTicks(
          origin.ticks,
          event.clientX - origin.clientX,
          origin.ticksPerCssPixel,
          profileId,
        ),
      );
      return;
    }
    if (event.pointerType !== "touch") {
      setMovingAssemblyHovered(pointerIsOnMovingAssembly(event));
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerRef.current = null;
    dragOriginRef.current = null;
    setDragging(false);
    setMovingAssemblyHovered(
      event.pointerType !== "touch" && pointerIsOnMovingAssembly(event),
    );
    setAnnouncement(
      answerVisible ? `Medida ajustada para ${reading}.` : "Medida ajustada.",
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    let nextTicks = ticks;
    const arrowStep =
      profile.resolutionTicks * (event.shiftKey ? 10 : 1);
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        nextTicks -= arrowStep;
        break;
      case "ArrowRight":
      case "ArrowUp":
        nextTicks += arrowStep;
        break;
      case "PageDown":
        nextTicks -= EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS;
        break;
      case "PageUp":
        nextTicks += EXTERNAL_MICROMETER_SPINDLE_PITCH_TICKS;
        break;
      case "Home":
        nextTicks = EXTERNAL_MICROMETER_MIN_TICKS;
        break;
      case "End":
        nextTicks = EXTERNAL_MICROMETER_MAX_TICKS;
        break;
      default:
        return;
    }
    event.preventDefault();
    setReading(nextTicks);
  };

  const randomize = () => {
    const representableSteps =
      EXTERNAL_MICROMETER_MAX_TICKS / profile.resolutionTicks;
    const next =
      Math.floor(Math.random() * (representableSteps + 1)) *
      profile.resolutionTicks;
    setTicks(next);
    setAnswerVisible(false);
    setAnnouncement("Nova medida sorteada. A resposta está oculta.");
    canvasRef.current?.focus();
  };

  const toggleFullscreen = async () => {
    if (!labRef.current || !document.fullscreenEnabled) {
      setAnnouncement("A tela cheia não está disponível neste navegador.");
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await labRef.current.requestFullscreen();
    } catch {
      setAnnouncement("Não foi possível alternar a tela cheia.");
    }
  };

  const toggleDetail = () => {
    if (detailMode) {
      closeDetail();
      return;
    }
    setDetailMode(true);
    setAnnouncement(
      `Escalas ampliadas. O arraste mantém a precisão selecionada de ${profile.label} por pixel.`,
    );
    window.requestAnimationFrame(() => canvasRef.current?.focus());
  };

  const toggleAnswer = () => {
    setAnswerVisible((visible) => {
      setAnnouncement(
        visible ? "Resposta ocultada." : `Resposta exibida: ${reading}.`,
      );
      return !visible;
    });
  };

  const toggleScaleNumbers = () => {
    setScaleNumbersVisible((visible) => {
      setAnnouncement(
        visible
          ? "Números das escalas ocultados. Os traços permanecem visíveis."
          : "Números das escalas exibidos.",
      );
      return !visible;
    });
  };

  const ariaValue = externalMicrometerTicksToMm(ticks);

  return (
    <div className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a
          className="brand"
          href="#simulador-micrometro-externo"
          aria-label="Cabalero Automações — micrômetro externo"
        >
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-copy">
            <strong>Cabalero_Automações</strong>
            <small>Engenharia de Software aplicada à Indústria</small>
          </span>
        </a>
        <div className="header-actions">
          <InstrumentSelector
            activeInstrument={activeInstrument}
            onInstrumentChange={onInstrumentChange}
          />
          <button className="icon-text-button" type="button" onClick={toggleFullscreen}>
            <span aria-hidden="true">⛶</span>
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
        </div>
      </header>

      <section
        className="workbench"
        id="simulador-micrometro-externo"
        aria-labelledby="external-micrometer-title"
      >
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="external-micrometer-title">Micrômetro externo analógico</h1>
            <InstrumentSelector
              className="stage-instrument-picker"
              activeInstrument={activeInstrument}
              onInstrumentChange={onInstrumentChange}
            />
          </div>
          <div className="stage-aside">
            <p className="interaction-hint micrometer-hint">
              <span aria-hidden="true">→</span>
              Arraste o tambor · passo {profile.label}
            </p>
            <div className="readout" data-hidden={!answerVisible}>
              <div className="readout-label">
                <span>Medida externa</span>
                <button
                  className="eye-button"
                  type="button"
                  aria-label={answerVisible ? "Ocultar medida" : "Exibir medida"}
                  aria-pressed={!answerVisible}
                  title={answerVisible ? "Ocultar medida" : "Exibir medida"}
                  onClick={toggleAnswer}
                >
                  <span
                    className={`eye-symbol${answerVisible ? "" : " is-closed"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="reading-value" aria-hidden={!answerVisible}>
                {answerVisible ? reading : "••••••••"}
              </p>
              <p className="reading-breakdown">
                {answerVisible ? compactBreakdown : "Resposta oculta para a turma"}
              </p>
            </div>
          </div>
        </div>

        <div className="instrument-stage micrometer-stage" data-detail={detailMode}>
          <button
            className="scale-numbers-control"
            type="button"
            data-hidden={!scaleNumbersVisible}
            aria-controls="external-micrometer-canvas"
            aria-pressed={!scaleNumbersVisible}
            aria-label={
              scaleNumbersVisible
                ? "Ocultar números das escalas"
                : "Mostrar números das escalas"
            }
            title={
              scaleNumbersVisible
                ? "Ocultar números das escalas"
                : "Mostrar números das escalas"
            }
            onClick={toggleScaleNumbers}
          >
            <span className="scale-numbers-symbol" aria-hidden="true">123</span>
          </button>
          <button
            ref={detailButtonRef}
            className={`detail-control${detailMode ? " is-active" : ""}`}
            type="button"
            aria-controls="external-micrometer-canvas"
            aria-expanded={detailMode}
            aria-pressed={detailMode}
            aria-label={
              detailMode ? "Fechar ampliação" : "Ampliar bainha, nônio e tambor"
            }
            title={detailMode ? "Fechar ampliação (Esc)" : "Ampliar escalas"}
            onClick={toggleDetail}
          >
            {detailMode ? (
              <span className="close-symbol" aria-hidden="true" />
            ) : (
              <span className="magnifier-symbol" aria-hidden="true" />
            )}
          </button>
          <canvas
            id="external-micrometer-canvas"
            ref={canvasRef}
            className={`caliper-canvas micrometer-canvas${movingAssemblyHovered ? " is-interactive" : ""}${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label={`Ajustar o micrômetro externo. Faixa de 0 a 25 milímetros. Resolução ${profile.label}.${detailMode ? " Escalas ampliadas." : ""}`}
            aria-valuemin={0}
            aria-valuemax={25}
            aria-valuenow={ariaValue}
            aria-valuetext={answerVisible ? reading : "Resposta oculta"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onLostPointerCapture={cancelPointer}
            onPointerLeave={() => {
              if (!dragging) setMovingAssemblyHovered(false);
            }}
            onKeyDown={onKeyDown}
          >
            Simulador de micrômetro externo. Use os controles para definir a medida.
          </canvas>
          <div className="stage-legend" aria-hidden="true">
            <span><i className="legend-fixed" /> quadro e bigorna fixos</span>
            <span><i className="legend-moving" /> fuso e tambor móveis</span>
          </div>
        </div>

        <div
          className="control-deck micrometer-control-deck"
          aria-label="Controles do micrômetro externo"
        >
          <fieldset className="control-group external-resolution-control">
            <legend>Resolução</legend>
            <div className="resolution-options external-resolution-options">
              {EXTERNAL_MICROMETER_PROFILE_IDS.map((optionId) => {
                const option = EXTERNAL_MICROMETER_PROFILES[optionId];
                return (
                  <button
                    key={option.id}
                    type="button"
                    data-active={profileId === option.id}
                    aria-pressed={profileId === option.id}
                    onClick={() => changeProfile(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="micrometer-step-controls" aria-label="Ajuste fino">
            <button
              className="secondary-button"
              type="button"
              disabled={ticks === EXTERNAL_MICROMETER_MIN_TICKS}
              aria-label={`Diminuir ${profile.label}`}
              onClick={() => setReading(ticks - profile.resolutionTicks)}
            >
              − <span>{profile.shortLabel}</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={ticks === EXTERNAL_MICROMETER_MAX_TICKS}
              aria-label={`Aumentar ${profile.label}`}
              onClick={() => setReading(ticks + profile.resolutionTicks)}
            >
              + <span>{profile.shortLabel}</span>
            </button>
          </div>
          <output
            className="conversion-output"
            data-hidden={!answerVisible}
            aria-label={
              answerVisible
                ? `Conversão automática de milímetros para polegadas: ${convertedReading}`
                : "Conversão automática oculta junto com a resposta"
            }
          >
            <span>Conversão mm → in</span>
            <strong>{answerVisible ? convertedReading : "••••"}</strong>
          </output>
          <div className="practice-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setReading(EXTERNAL_MICROMETER_MIN_TICKS)}
            >
              <span className="button-icon" aria-hidden="true">↺</span>
              Ir ao zero
            </button>
            <button
              className="primary-button"
              type="button"
              aria-label="Sortear medida e ocultar resposta"
              onClick={randomize}
            >
              <span className="button-icon" aria-hidden="true">⚄</span>
              <span className="button-label-wide">Sortear e ocultar</span>
              <span className="button-label-compact" aria-hidden="true">Sortear</span>
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    </div>
  );
}

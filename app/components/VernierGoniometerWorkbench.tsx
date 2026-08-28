"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  GONIOMETER_FULL_TURN_TICKS,
  GONIOMETER_PROFILE,
  GONIOMETER_RESOLUTION_TICKS,
  decomposeVernierGoniometerReading,
  formatVernierGoniometerBreakdown,
  formatVernierGoniometerReading,
  formatVernierGoniometerReadingAccessible,
  getRandomVernierGoniometerTicks,
  snapVernierGoniometerTicks,
  stepVernierGoniometerTicks,
  type GoniometerDirection,
} from "../../lib/vernier-goniometer";
import {
  getGoniometerScalePresentation,
  getGoniometerMainScaleMarkAngleDegrees,
  getGoniometerVernierMarkAngleDegrees,
  getVernierGoniometerDetailViewport,
  getVernierGoniometerGeometry,
  type VernierGoniometerGeometry,
} from "../../lib/vernier-goniometer-geometry";
import {
  getPointerAngleDegrees,
  getShortestAngularDeltaDegrees,
  isPointerOutsidePivotDeadZone,
} from "../../lib/vernier-goniometer-interaction";
import { InstrumentSelector } from "./InstrumentSelector";
import type { InstrumentNavigationProps } from "./instrument-types";

const INITIAL_GONIOMETER_TICKS = 3_150;

export interface VernierGoniometerSessionState {
  readonly ticks: number;
  readonly direction: GoniometerDirection;
  readonly answerVisible: boolean;
  readonly scaleNumbersVisible: boolean;
}

interface VernierGoniometerWorkbenchProps extends InstrumentNavigationProps {
  readonly initialSession?: VernierGoniometerSessionState;
  readonly onSessionChange?: (session: VernierGoniometerSessionState) => void;
}

function toScenePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  ticks: number,
  detailMode: boolean,
) {
  const layout = getVernierGoniometerGeometry(rect.width, rect.height, ticks);
  let x = clientX - rect.left;
  let y = clientY - rect.top;
  const viewport = detailMode
    ? getVernierGoniometerDetailViewport(rect.width, rect.height, layout)
    : null;
  if (viewport) {
    x = (x - viewport.targetX) / viewport.zoom + viewport.focusX;
    y = (y - viewport.targetY) / viewport.zoom + viewport.focusY;
  }
  return { x, y, layout };
}

function distanceToSegment(
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSquared));
  return Math.hypot(x - (startX + t * dx), y - (startY + t * dy));
}

function isPointOnMovingAssembly(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  ticks: number,
  detailMode: boolean,
) {
  const { x, y, layout } = toScenePoint(
    clientX,
    clientY,
    rect,
    ticks,
    detailMode,
  );
  const onHead =
    Math.hypot(x - layout.pivotX, y - layout.pivotY) <= layout.hitRadius;
  const onBlade =
    distanceToSegment(
      x,
      y,
      layout.bladeStartX,
      layout.bladeStartY,
      layout.bladeEndX,
      layout.bladeEndY,
    ) <= Math.max(22, layout.bladeWidth * 0.75);
  return onHead || onBlade;
}

function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number,
) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function drawRadialScaleLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  angleDegrees: number,
  fontPx: number,
  color: string,
) {
  const normalized = ((angleDegrees % 360) + 360) % 360;
  let rotation = (angleDegrees * Math.PI) / 180;
  if (normalized > 90 && normalized < 270) rotation += Math.PI;
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = color;
  context.font = `700 ${fontPx}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 0, 0);
  context.restore();
}

/** Draw a compact upright label on its own radial track. */
function drawUprightVernierLabel(
  context: CanvasRenderingContext2D,
  text: string,
  _markX: number,
  _markY: number,
  labelX: number,
  labelY: number,
  fontPx: number,
  color: string,
) {
  context.save();
  context.translate(labelX, labelY);
  context.fillStyle = color;
  context.font = `700 ${fontPx}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 0, 0);
  context.restore();
}

function drawMetalBlade(
  context: CanvasRenderingContext2D,
  layout: VernierGoniometerGeometry,
  dragging: boolean,
) {
  const { B, bladeCenterX, bladeCenterY, bladeLength, bladeWidth } = layout;
  context.save();
  context.translate(bladeCenterX, bladeCenterY);
  context.rotate((layout.bladeAngleDegrees * Math.PI) / 180);
  const halfLength = bladeLength / 2;
  const halfWidth = bladeWidth / 2;
  const bevel = Math.min(B * 0.34, bladeWidth * 0.72);
  const blade = new Path2D();
  blade.moveTo(-halfLength + bevel, -halfWidth);
  blade.lineTo(halfLength, -halfWidth);
  blade.lineTo(halfLength - bevel, halfWidth);
  blade.lineTo(-halfLength, halfWidth);
  blade.closePath();
  const gradient = context.createLinearGradient(0, -halfWidth, 0, halfWidth);
  gradient.addColorStop(0, dragging ? "#f5e7ec" : "#efefed");
  gradient.addColorStop(0.48, dragging ? "#cfaeba" : "#bdbdba");
  gradient.addColorStop(1, "#777875");
  context.fillStyle = gradient;
  context.fill(blade);
  context.strokeStyle = "#3e3e3c";
  context.lineWidth = Math.max(1.2, B * 0.026);
  context.stroke(blade);
  context.strokeStyle = "rgba(255,255,255,0.75)";
  context.lineWidth = Math.max(1, B * 0.018);
  context.beginPath();
  context.moveTo(-halfLength + bevel * 0.7, -halfWidth * 0.44);
  context.lineTo(halfLength - bevel * 0.4, -halfWidth * 0.44);
  context.stroke();
  context.strokeStyle = "rgba(55,55,53,0.45)";
  context.beginPath();
  context.moveTo(-halfLength + bevel * 0.5, halfWidth * 0.42);
  context.lineTo(halfLength - bevel * 0.65, halfWidth * 0.42);
  context.stroke();
  context.restore();
}

function drawPhysicalMagnifier(
  context: CanvasRenderingContext2D,
  layout: VernierGoniometerGeometry,
) {
  const { B, pivotX, pivotY, vernierDatumAngleDegrees } = layout;
  const lensCenter = pointOnCircle(
    pivotX,
    pivotY,
    B * 1.13,
    vernierDatumAngleDegrees,
  );
  context.save();
  context.translate(lensCenter.x, lensCenter.y);
  context.rotate((vernierDatumAngleDegrees * Math.PI) / 180);
  context.beginPath();
  context.moveTo(-B * 0.42, 0);
  context.lineTo(-B * 0.74, 0);
  context.strokeStyle = "#414846";
  context.lineWidth = Math.max(1.4, B * 0.035);
  context.stroke();
  context.beginPath();
  context.ellipse(0, 0, B * 0.47, B * 0.29, 0, 0, Math.PI * 2);
  context.fillStyle = "rgba(239,248,249,0.5)";
  context.fill();
  context.strokeStyle = "#414846";
  context.lineWidth = Math.max(1.4, B * 0.035);
  context.stroke();
  context.restore();
}

function drawVernierScale(
  context: CanvasRenderingContext2D,
  layout: VernierGoniometerGeometry,
  ticks: number,
  direction: GoniometerDirection,
  scaleNumbersVisible: boolean,
  projectionScale: number,
) {
  const { B, pivotX, pivotY, vernierDatumAngleDegrees } = layout;
  const presentation = getGoniometerScalePresentation(layout, projectionScale);
  const activeDirection = direction === "clockwise" ? -1 : 1;
  const plateInner = presentation.vernierPlateInnerRadius;
  const plateOuter = presentation.vernierPlateOuterRadius;
  const sectorHalf = 27;

  context.save();
  context.beginPath();
  context.arc(
    pivotX,
    pivotY,
    plateOuter,
    ((vernierDatumAngleDegrees - sectorHalf) * Math.PI) / 180,
    ((vernierDatumAngleDegrees + sectorHalf) * Math.PI) / 180,
  );
  context.arc(
    pivotX,
    pivotY,
    plateInner,
    ((vernierDatumAngleDegrees + sectorHalf) * Math.PI) / 180,
    ((vernierDatumAngleDegrees - sectorHalf) * Math.PI) / 180,
    true,
  );
  context.closePath();
  context.fillStyle = "rgba(232,232,229,0.96)";
  context.fill();

  // Preserve the common reading seam. The old full outline crossed the main
  // scale numbers and looked like a detached border laid over the dial.
  context.strokeStyle = "#555653";
  context.lineWidth = Math.max(1, B * 0.018);
  const startAngle = vernierDatumAngleDegrees - sectorHalf;
  const endAngle = vernierDatumAngleDegrees + sectorHalf;
  const startOuter = pointOnCircle(pivotX, pivotY, plateOuter, startAngle);
  const startInner = pointOnCircle(pivotX, pivotY, plateInner, startAngle);
  const endOuter = pointOnCircle(pivotX, pivotY, plateOuter, endAngle);
  const endInner = pointOnCircle(pivotX, pivotY, plateInner, endAngle);
  context.beginPath();
  context.arc(
    pivotX,
    pivotY,
    plateInner,
    (startAngle * Math.PI) / 180,
    (endAngle * Math.PI) / 180,
  );
  context.moveTo(startInner.x, startInner.y);
  context.lineTo(startOuter.x, startOuter.y);
  context.moveTo(endInner.x, endInner.y);
  context.lineTo(endOuter.x, endOuter.y);
  context.stroke();

  for (const side of [-1, 1] as const) {
    for (let division = 0; division <= 12; division += 1) {
      if (division === 0 && side === 1) continue;
      const angle = getGoniometerVernierMarkAngleDegrees(ticks, division, side);
      const active = side === activeDirection && division === layout.matchingVernierDivision;
      const outer = pointOnCircle(pivotX, pivotY, plateOuter - B * 0.025, angle);
      const length = active
        ? B * 0.22
        : division % 3 === 0
          ? B * 0.18
          : B * 0.14;
      const inner = pointOnCircle(pivotX, pivotY, plateOuter - length, angle);
      context.beginPath();
      context.moveTo(outer.x, outer.y);
      context.lineTo(inner.x, inner.y);
      context.strokeStyle = active ? "#7c2145" : "#171719";
      context.lineWidth = active ? Math.max(2.2, B * 0.055) : Math.max(1, B * 0.018);
      context.stroke();
      if (
        scaleNumbersVisible &&
        side === activeDirection &&
        presentation.vernierLabelDivisions.includes(division)
      ) {
        const labelRadius = division === 12
          ? presentation.vernierEndpointLabelRadius
          : division % 6 === 0
            ? presentation.vernierInnerLabelRadius
            : presentation.vernierOuterLabelRadius;
        const labelPoint = pointOnCircle(
          pivotX,
          pivotY,
          labelRadius,
          angle,
        );
        const markPoint = pointOnCircle(
          pivotX,
          pivotY,
          plateOuter - length,
          angle,
        );
        drawUprightVernierLabel(
          context,
          String(division * 5),
          markPoint.x,
          markPoint.y,
          labelPoint.x,
          labelPoint.y,
          presentation.vernierLabelFontPx,
          active ? "#7c2145" : "#202022",
        );
      }
    }
  }

  const zeroOuter = pointOnCircle(pivotX, pivotY, plateOuter, vernierDatumAngleDegrees);
  const zeroInner = pointOnCircle(
    pivotX,
    pivotY,
    plateOuter - B * 0.39,
    vernierDatumAngleDegrees,
  );
  context.beginPath();
  context.moveTo(zeroOuter.x, zeroOuter.y);
  context.lineTo(zeroInner.x, zeroInner.y);
  context.strokeStyle = "#7c2145";
  context.lineWidth = Math.max(2, B * 0.05);
  context.stroke();
  if (scaleNumbersVisible) {
    const zeroLabel = pointOnCircle(
      pivotX,
      pivotY,
      presentation.zeroLabelRadius,
      vernierDatumAngleDegrees,
    );
    const zeroMark = pointOnCircle(
      pivotX,
      pivotY,
      plateOuter - B * 0.39,
      vernierDatumAngleDegrees,
    );
    drawUprightVernierLabel(
      context,
      "0",
      zeroMark.x,
      zeroMark.y,
      zeroLabel.x,
      zeroLabel.y,
      presentation.vernierLabelFontPx,
      "#7c2145",
    );
  }
  context.restore();
}

function drawVernierGoniometer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  ticks: number,
  direction: GoniometerDirection,
  dragging: boolean,
  detailMode: boolean,
  readingLabel: string,
  answerVisible: boolean,
  scaleNumbersVisible: boolean,
) {
  const layout = getVernierGoniometerGeometry(width, height, ticks, direction);
  const {
    B,
    pivotX,
    pivotY,
    headRadius,
    dialRadius,
    scaleRadius,
  } = layout;
  context.clearRect(0, 0, width, height);
  context.save();
  const viewport = detailMode
    ? getVernierGoniometerDetailViewport(width, height, layout)
    : null;
  const projectionScale = viewport?.zoom ?? 1;
  const scalePresentation = getGoniometerScalePresentation(
    layout,
    projectionScale,
  );
  if (viewport) {
    context.translate(viewport.targetX, viewport.targetY);
    context.scale(viewport.zoom, viewport.zoom);
    context.translate(-viewport.focusX, -viewport.focusY);
  }

  if (!detailMode) {
    const metalGradient = context.createLinearGradient(
      0,
      layout.baseTop,
      0,
      layout.baseBottom,
    );
    metalGradient.addColorStop(0, "#ededeb");
    metalGradient.addColorStop(0.5, "#b9b9b6");
    metalGradient.addColorStop(1, "#777875");
    context.fillStyle = metalGradient;
    context.strokeStyle = "#444543";
    context.lineWidth = Math.max(1.2, B * 0.024);
    context.beginPath();
    context.roundRect(
      layout.baseStartX,
      layout.baseTop,
      layout.baseEndX - layout.baseStartX,
      layout.baseBottom - layout.baseTop,
      B * 0.08,
    );
    context.fill();
    context.stroke();

    const stock = new Path2D();
    stock.moveTo(layout.stockLeft, layout.stockBottom);
    stock.lineTo(layout.stockLeft, layout.stockTop + B * 0.34);
    stock.lineTo(layout.stockLeft + B * 0.32, layout.stockTop);
    stock.lineTo(layout.stockRight, layout.stockTop);
    stock.lineTo(layout.stockRight, layout.stockBottom);
    stock.closePath();
    context.fillStyle = metalGradient;
    context.fill(stock);
    context.stroke(stock);
    context.fillStyle = "#5a5b58";
    context.beginPath();
    context.roundRect(
      layout.stockLeft + B * 0.25,
      layout.stockTop + B * 0.73,
      B * 0.28,
      B * 0.42,
      B * 0.08,
    );
    context.fill();
  }

  const headGradient = context.createRadialGradient(
    pivotX - B * 0.38,
    pivotY - B * 0.44,
    B * 0.12,
    pivotX,
    pivotY,
    headRadius,
  );
  headGradient.addColorStop(0, "#f1f1ef");
  headGradient.addColorStop(0.58, "#b9bab7");
  headGradient.addColorStop(1, "#747572");
  context.beginPath();
  context.arc(pivotX, pivotY, headRadius, 0, Math.PI * 2);
  context.fillStyle = headGradient;
  context.fill();
  context.strokeStyle = "#454644";
  context.lineWidth = Math.max(1.3, B * 0.028);
  context.stroke();

  context.beginPath();
  context.arc(pivotX, pivotY, dialRadius, 0, Math.PI * 2);
  context.fillStyle = "#d7d7d4";
  context.fill();
  context.strokeStyle = "#6a6b68";
  context.lineWidth = Math.max(1, B * 0.018);
  context.stroke();

  for (let degree = 0; degree < 360; degree += 1) {
    const angle = getGoniometerMainScaleMarkAngleDegrees(degree);
    const major = degree % 10 === 0;
    const medium = degree % 5 === 0;
    const outer = pointOnCircle(pivotX, pivotY, scaleRadius, angle);
    const length = major ? B * 0.17 : medium ? B * 0.12 : B * 0.075;
    const inner = pointOnCircle(pivotX, pivotY, scaleRadius - length, angle);
    context.beginPath();
    context.moveTo(outer.x, outer.y);
    context.lineTo(inner.x, inner.y);
    context.strokeStyle = "#242426";
    context.lineWidth = major ? Math.max(1.3, B * 0.026) : Math.max(0.75, B * 0.012);
    context.stroke();
    if (
      scaleNumbersVisible &&
      major &&
      degree % scalePresentation.mainLabelIntervalDegrees === 0
    ) {
      const quadrant = degree % 180;
      const label = quadrant <= 90 ? quadrant : 180 - quadrant;
      const point = pointOnCircle(
        pivotX,
        pivotY,
        scalePresentation.mainLabelRadius,
        angle,
      );
      drawRadialScaleLabel(
        context,
        String(label),
        point.x,
        point.y,
        angle,
        scalePresentation.mainLabelFontPx,
        "#1e1e20",
      );
    }
  }

  const movingPlateGradient = context.createRadialGradient(
    pivotX - B * 0.2,
    pivotY - B * 0.25,
    B * 0.08,
    pivotX,
    pivotY,
    dialRadius * 0.74,
  );
  movingPlateGradient.addColorStop(0, dragging ? "#f5e9ed" : "#ebebe9");
  movingPlateGradient.addColorStop(1, dragging ? "#b993a2" : "#a1a29f");
  context.beginPath();
  context.arc(pivotX, pivotY, dialRadius * 0.69, 0, Math.PI * 2);
  context.fillStyle = movingPlateGradient;
  context.fill();
  context.strokeStyle = "#585956";
  context.stroke();

  if (!detailMode) {
    drawMetalBlade(context, layout, dragging);

    // The blade clamp is a bar crossing the blade and anchored by the center
    // knob. Centering it removes the detached lower-left slab from the old
    // projection and matches the visible INSIZE topology.
    context.save();
    context.translate(pivotX, pivotY);
    context.rotate((layout.bladeAngleDegrees * Math.PI) / 180);
    context.fillStyle = "#b8b9b6";
    context.strokeStyle = "#50514f";
    context.lineWidth = Math.max(1, B * 0.02);
    context.beginPath();
    context.roundRect(-B * 0.62, -B * 0.27, B * 1.42, B * 0.54, B * 0.08);
    context.fill();
    context.stroke();
    context.restore();

    // The lens and its bridge sit below the engraved scale projection. This
    // keeps the frame from crossing the minute labels while retaining the
    // physical magnifier silhouette.
    drawPhysicalMagnifier(context, layout);
  }

  drawVernierScale(
    context,
    layout,
    ticks,
    direction,
    scaleNumbersVisible,
    projectionScale,
  );

  if (detailMode) {
    context.restore();
    context.save();
    const compactDetail = width < 500;
    const noteY = compactDetail ? 72 : 12;
    const noteWidth = compactDetail
      ? Math.max(220, width - 28)
      : Math.min(330, Math.max(240, width - 150));
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.beginPath();
    context.roundRect(14, noteY, noteWidth, 50, 6);
    context.fill();
    context.fillStyle = "#4e4a4d";
    context.font = "700 12px Arial, sans-serif";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText("AMPLIAÇÃO DAS ESCALAS", 22, noteY + 7);
    context.fillStyle = "#6a6267";
    context.font = "600 11px Arial, sans-serif";
    context.fillText(
      `${compactDetail ? "graus fixos" : "graus na escala fixa"} · minutos no nônio ${direction === "clockwise" ? "direito" : "esquerdo"}`,
      22,
      noteY + 28,
    );
    context.restore();
    return;
  }

  const clampPoint = pointOnCircle(
    pivotX,
    pivotY,
    B * 0.82,
    layout.bladeAngleDegrees - 15,
  );
  const clampBridgeStart = pointOnCircle(
    pivotX,
    pivotY,
    B * 0.28,
    layout.bladeAngleDegrees - 15,
  );
  context.beginPath();
  context.moveTo(clampBridgeStart.x, clampBridgeStart.y);
  context.lineTo(clampPoint.x, clampPoint.y);
  context.strokeStyle = "#777875";
  context.lineWidth = Math.max(5, B * 0.2);
  context.lineCap = "round";
  context.stroke();
  context.lineCap = "butt";
  for (const [x, y, radius] of [
    [pivotX, pivotY, B * 0.3],
    [clampPoint.x, clampPoint.y, B * 0.22],
  ] as const) {
    const knob = context.createRadialGradient(
      x - radius * 0.34,
      y - radius * 0.34,
      radius * 0.08,
      x,
      y,
      radius,
    );
    knob.addColorStop(0, "#f6f6f4");
    knob.addColorStop(0.62, "#b1b2af");
    knob.addColorStop(1, "#656663");
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = knob;
    context.fill();
    context.strokeStyle = "#4a4b48";
    context.stroke();
  }

  // Small retaining screw, physically attached below the right side of the
  // base. The previous wide block near the head looked like loose debris.
  const baseFastenerX = layout.baseEndX - B * 0.72;
  context.fillStyle = "#565754";
  context.beginPath();
  context.roundRect(
    baseFastenerX,
    layout.baseBottom - B * 0.01,
    B * 0.12,
    B * 0.16,
    B * 0.025,
  );
  context.fill();
  context.fillStyle = "#252527";
  context.font = `700 ${Math.max(7, B * 0.16)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    "CABALERO",
    (layout.baseStartX + layout.baseEndX) / 2,
    (layout.baseTop + layout.baseBottom) / 2,
  );

  const arcRadius = B * 1.62;
  const startAngle = Math.PI;
  const endAngle = (layout.bladeAngleDegrees * Math.PI) / 180;
  context.beginPath();
  context.arc(pivotX, pivotY, arcRadius, startAngle, endAngle, true);
  context.strokeStyle = "#7c2145";
  context.lineWidth = Math.max(1.6, B * 0.035);
  context.stroke();
  const labelPoint = pointOnCircle(
    pivotX,
    pivotY,
    arcRadius + B * 0.24,
    (180 + layout.bladeAngleDegrees) / 2,
  );
  context.font = `700 ${Math.max(10, B * 0.19)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = Math.max(3, B * 0.06);
  context.strokeStyle = "#ffffff";
  const canvasLabel = answerVisible ? readingLabel : "?";
  context.strokeText(canvasLabel, labelPoint.x, labelPoint.y);
  context.fillStyle = "#7c2145";
  context.fillText(canvasLabel, labelPoint.x, labelPoint.y);

  context.restore();
}

export function VernierGoniometerWorkbench({
  activeInstrument,
  onInstrumentChange,
  initialSession,
  onSessionChange,
}: VernierGoniometerWorkbenchProps) {
  const [ticks, setTicks] = useState(() =>
    snapVernierGoniometerTicks(initialSession?.ticks ?? INITIAL_GONIOMETER_TICKS),
  );
  const [direction, setDirection] = useState<GoniometerDirection>(
    initialSession?.direction ?? "clockwise",
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
  const dragRef = useRef<{
    lastAngleDegrees: number;
    rawTicks: number;
  } | null>(null);

  const reading = formatVernierGoniometerReading(ticks, true, direction);
  const decomposition = decomposeVernierGoniometerReading(ticks, direction);
  const breakdown = formatVernierGoniometerBreakdown(decomposition);
  const accessibleReading = formatVernierGoniometerReadingAccessible(
    ticks,
    direction,
  );

  useEffect(() => {
    onSessionChange?.({ ticks, direction, answerVisible, scaleNumbersVisible });
  }, [answerVisible, direction, onSessionChange, scaleNumbersVisible, ticks]);

  const setReading = useCallback((candidateTicks: number) => {
    setTicks(snapVernierGoniometerTicks(candidateTicks));
  }, []);

  const cancelPointer = useCallback(() => {
    activePointerRef.current = null;
    dragRef.current = null;
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
      drawVernierGoniometer(
        context,
        rect.width,
        rect.height,
        ticks,
        direction,
        dragging,
        detailMode,
        reading,
        answerVisible,
        scaleNumbersVisible,
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
  }, [answerVisible, detailMode, direction, dragging, reading, scaleNumbersVisible, ticks]);

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
    const rect = event.currentTarget.getBoundingClientRect();
    const point = toScenePoint(
      event.clientX,
      event.clientY,
      rect,
      ticks,
      detailMode,
    );
    if (
      !isPointerOutsidePivotDeadZone(
        point.x,
        point.y,
        point.layout.pivotX,
        point.layout.pivotY,
        point.layout.deadZoneRadius,
      )
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    dragRef.current = {
      lastAngleDegrees: getPointerAngleDegrees(
        point.x,
        point.y,
        point.layout.pivotX,
        point.layout.pivotY,
      ),
      rawTicks: ticks,
    };
    setDragging(true);
    setMovingAssemblyHovered(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const point = toScenePoint(
        event.clientX,
        event.clientY,
        rect,
        ticks,
        detailMode,
      );
      const currentAngle = getPointerAngleDegrees(
        point.x,
        point.y,
        point.layout.pivotX,
        point.layout.pivotY,
      );
      const delta = getShortestAngularDeltaDegrees(
        drag.lastAngleDegrees,
        currentAngle,
      );
      drag.lastAngleDegrees = currentAngle;
      drag.rawTicks -= delta * 60;
      if (Math.abs(delta) > 0.001) {
        setDirection(delta < 0 ? "clockwise" : "counterclockwise");
      }
      setReading(drag.rawTicks);
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
    dragRef.current = null;
    setDragging(false);
    setMovingAssemblyHovered(
      event.pointerType !== "touch" && pointerIsOnMovingAssembly(event),
    );
    setAnnouncement(
      answerVisible ? `Ângulo ajustado para ${reading}.` : "Ângulo ajustado.",
    );
  };

  const changeBySteps = (deltaSteps: number) => {
    setDirection(deltaSteps >= 0 ? "clockwise" : "counterclockwise");
    setTicks(stepVernierGoniometerTicks(ticks, deltaSteps));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const arrowSteps = event.shiftKey ? 12 : 1;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        changeBySteps(-arrowSteps);
        break;
      case "ArrowRight":
      case "ArrowUp":
        changeBySteps(arrowSteps);
        break;
      case "PageDown":
        changeBySteps(-60);
        break;
      case "PageUp":
        changeBySteps(60);
        break;
      case "Home":
        setDirection("clockwise");
        setReading(0);
        break;
      case "End":
        setDirection("counterclockwise");
        setReading(GONIOMETER_FULL_TURN_TICKS - GONIOMETER_RESOLUTION_TICKS);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const randomize = () => {
    setTicks(getRandomVernierGoniometerTicks());
    setDirection("clockwise");
    setAnswerVisible(false);
    setAnnouncement("Novo ângulo sorteado. A resposta está oculta.");
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
      "Escalas principal e do nônio ampliadas. O goniômetro continua ajustável.",
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

  return (
    <div className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a
          className="brand"
          href="#simulador-goniometro"
          aria-label="Cabalero Automações — goniômetro universal"
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
        id="simulador-goniometro"
        aria-labelledby="goniometer-title"
      >
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="goniometer-title">Goniômetro universal com nônio</h1>
            <InstrumentSelector
              className="stage-instrument-picker"
              compactLabel
              activeInstrument={activeInstrument}
              onInstrumentChange={onInstrumentChange}
            />
          </div>
          <div className="stage-aside">
            <p className="interaction-hint goniometer-hint">
              <span aria-hidden="true">↻</span>
              Arraste a lâmina · passo de 5′
            </p>
            <div className="readout" data-hidden={!answerVisible}>
              <div className="readout-label">
                <span>Ângulo atual</span>
                <button
                  className="eye-button"
                  type="button"
                  aria-label={answerVisible ? "Ocultar ângulo" : "Exibir ângulo"}
                  aria-pressed={!answerVisible}
                  title={answerVisible ? "Ocultar ângulo" : "Exibir ângulo"}
                  onClick={toggleAnswer}
                >
                  <span
                    className={`eye-symbol${answerVisible ? "" : " is-closed"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="reading-value" aria-hidden={!answerVisible}>
                {answerVisible ? reading : "••••••"}
              </p>
              <p className="reading-breakdown">
                {answerVisible ? breakdown : "Resposta oculta para a turma"}
              </p>
            </div>
          </div>
        </div>

        <div className="instrument-stage goniometer-stage" data-detail={detailMode}>
          <button
            className="scale-numbers-control"
            type="button"
            data-hidden={!scaleNumbersVisible}
            aria-controls="goniometer-canvas"
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
            aria-controls="goniometer-canvas"
            aria-expanded={detailMode}
            aria-pressed={detailMode}
            aria-label={detailMode ? "Fechar ampliação" : "Ampliar escalas"}
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
            id="goniometer-canvas"
            ref={canvasRef}
            className={`caliper-canvas goniometer-canvas${movingAssemblyHovered ? " is-interactive" : ""}${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label={`Ajustar o goniômetro universal. Faixa de zero a trezentos e sessenta graus. Resolução ${GONIOMETER_PROFILE.label}.${detailMode ? " Escalas ampliadas." : ""}`}
            aria-valuemin={0}
            aria-valuemax={GONIOMETER_FULL_TURN_TICKS - GONIOMETER_RESOLUTION_TICKS}
            aria-valuenow={ticks}
            aria-valuetext={answerVisible ? accessibleReading : "Resposta oculta"}
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
            Simulador de goniômetro universal. Use os controles para definir o ângulo.
          </canvas>
          <div className="stage-legend" aria-hidden="true">
            <span><i className="legend-fixed" /> base e escala principal fixas</span>
            <span><i className="legend-moving" /> lâmina, placa e nônio móveis</span>
          </div>
        </div>

        <div
          className="control-deck micrometer-control-deck goniometer-control-deck"
          aria-label="Controles do goniômetro universal"
        >
          <div className="micrometer-specification">
            <span>Perfil do instrumento</span>
            <strong>Universal · nônio 5′</strong>
            <small>Faixa nominal 0–360° · exatidão declarada ±5′</small>
          </div>
          <div className="micrometer-step-controls" aria-label="Ajuste fino angular">
            <button
              className="secondary-button"
              type="button"
              aria-label="Diminuir cinco minutos"
              onClick={() => changeBySteps(-1)}
            >
              − <span>5′</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              aria-label="Aumentar cinco minutos"
              onClick={() => changeBySteps(1)}
            >
              + <span>5′</span>
            </button>
          </div>
          <output
            className="conversion-output"
            data-hidden={!answerVisible}
            aria-label={
              answerVisible
                ? `Leitura no sentido ${direction === "clockwise" ? "horário" : "anti-horário"}`
                : "Sentido de leitura oculto junto com a resposta"
            }
          >
            <span>Lado do nônio</span>
            <strong>
              {answerVisible
                ? direction === "clockwise"
                  ? "direito"
                  : "esquerdo"
                : "••••"}
            </strong>
          </output>
          <div className="practice-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setDirection("clockwise");
                setReading(0);
              }}
            >
              <span className="button-icon" aria-hidden="true">↺</span>
              Ir ao zero
            </button>
            <button
              className="primary-button"
              type="button"
              aria-label="Sortear ângulo e ocultar resposta"
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

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  INTERNAL_MICROMETER_MAX_TICKS,
  INTERNAL_MICROMETER_MIN_TICKS,
  INTERNAL_MICROMETER_PROFILE,
  INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS,
  INTERNAL_MICROMETER_TICKS_PER_MM,
  decomposeInternalMicrometerReading,
  formatInternalMicrometerBreakdown,
  formatInternalMicrometerInches,
  formatInternalMicrometerReading,
  internalMicrometerTicksToMm,
  snapInternalMicrometerTicks,
} from "../../lib/internal-micrometer";
import {
  getInternalMicrometerGeometry,
  type InternalMicrometerGeometry,
} from "../../lib/internal-micrometer-geometry";
import type {
  InstrumentId,
  InstrumentNavigationProps,
} from "./instrument-types";

const INITIAL_MICROMETER_TICKS = 736;

export interface InternalMicrometerSessionState {
  readonly ticks: number;
  readonly answerVisible: boolean;
  readonly scaleNumbersVisible: boolean;
}

interface InternalMicrometerWorkbenchProps extends InstrumentNavigationProps {
  readonly initialSession?: InternalMicrometerSessionState;
  readonly onSessionChange?: (session: InternalMicrometerSessionState) => void;
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
  layout: InternalMicrometerGeometry,
): DetailViewport {
  const sourceWidth = layout.B * 4.6;
  return {
    zoom: Math.min(2.55, Math.max(1.65, (width * 0.8) / sourceWidth)),
    focusX: layout.thimbleLeft + layout.B * 0.45,
    focusY: layout.referenceY,
    targetX: width * 0.5,
    targetY: height * 0.52,
  };
}

function getCompactOverviewViewport(
  width: number,
  height: number,
  layout: InternalMicrometerGeometry,
): DetailViewport | null {
  if (width >= 480) return null;
  const zoom = Math.min(1.5, Math.max(1.32, 480 / Math.max(320, width)));
  return {
    zoom,
    focusX: (layout.headX + layout.thimbleLeft) / 2,
    focusY: layout.axisY,
    targetX: width * 0.49,
    targetY: height * 0.52,
  };
}

function pathHeadNeck(
  layout: InternalMicrometerGeometry,
  direction: -1 | 1,
): Path2D {
  const { B, headX, axisY, sleeveStartX } = layout;
  const path = new Path2D();
  const contactY = direction < 0 ? layout.upperContactY : layout.lowerContactY;
  const innerY = axisY + direction * B * 0.38;
  path.moveTo(headX + B * 0.18, contactY);
  path.quadraticCurveTo(
    headX + B * 0.55,
    contactY,
    headX + B * 0.8,
    innerY,
  );
  path.lineTo(sleeveStartX, axisY + direction * B * 0.46);
  path.lineTo(sleeveStartX, axisY + direction * B * 0.12);
  path.lineTo(headX + B * 0.72, axisY + direction * B * 0.14);
  path.quadraticCurveTo(
    headX + B * 0.48,
    axisY + direction * B * 0.1,
    headX + B * 0.18,
    contactY - direction * B * 0.16,
  );
  path.closePath();
  return path;
}

function isPointOnMovingAssembly(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  ticks: number,
  detailMode: boolean,
): boolean {
  const layout = getInternalMicrometerGeometry(rect.width, rect.height, ticks);
  let x = clientX - rect.left;
  let y = clientY - rect.top;
  const viewport = detailMode
    ? getDetailViewport(rect.width, rect.height, layout)
    : getCompactOverviewViewport(rect.width, rect.height, layout);
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

function drawArrowHead(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: -1 | 1,
  size: number,
) {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x - size, y + direction * size);
  context.lineTo(x + size, y + direction * size);
  context.closePath();
  context.fill();
}

function drawInternalMicrometer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  ticks: number,
  dragging: boolean,
  detailMode: boolean,
  readingLabel: string,
  answerVisible: boolean,
  scaleNumbersVisible: boolean,
) {
  const layout = getInternalMicrometerGeometry(width, height, ticks);
  const {
    B,
    axisY,
    headX,
    sleeveStartX,
    sleeveEndX,
    sleeveTop,
    sleeveBottom,
    sleeveRadius,
    pixelsPerMm,
    scaleMaximumX,
    thimbleLeft,
    thimbleRight,
    thimbleTop,
    thimbleBottom,
    ratchetLeft,
    ratchetRight,
    contactCenterX,
    upperContactY,
    lowerContactY,
    referenceY,
    thimbleDivision,
  } = layout;
  const metalLight = "#eeeeec";
  const metal = "#c8c8c6";
  const metalMid = "#aaa9a7";
  const metalDark = "#6f6e6d";
  const ink = "#181619";
  const accent = "#7c2145";

  context.clearRect(0, 0, width, height);
  context.save();
  const viewport = detailMode
    ? getDetailViewport(width, height, layout)
    : getCompactOverviewViewport(width, height, layout);
  if (viewport) {
    context.translate(viewport.targetX, viewport.targetY);
    context.scale(viewport.zoom, viewport.zoom);
    context.translate(-viewport.focusX, -viewport.focusY);
  }
  context.lineJoin = "round";
  context.lineCap = "square";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, B * 0.018);

  // Three-contact measuring head. Two contacts are visible in profile; the
  // central circular datum explicitly identifies the third without inventing
  // perspective or simulating the unvalidated internal cone mechanism.
  for (const direction of [-1, 1] as const) {
    const neck = pathHeadNeck(layout, direction);
    context.fillStyle = metal;
    context.fill(neck);
    context.stroke(neck);
  }
  const contactWidth = B * 0.27;
  const contactHeight = B * 0.34;
  for (const contactY of [upperContactY, lowerContactY]) {
    const y = contactY - contactHeight / 2;
    const gradient = context.createLinearGradient(
      contactCenterX - contactWidth / 2,
      0,
      contactCenterX + contactWidth / 2,
      0,
    );
    gradient.addColorStop(0, metalDark);
    gradient.addColorStop(0.52, metalLight);
    gradient.addColorStop(1, metalDark);
    context.fillStyle = gradient;
    context.fillRect(contactCenterX - contactWidth / 2, y, contactWidth, contactHeight);
    context.strokeRect(contactCenterX - contactWidth / 2, y, contactWidth, contactHeight);
  }
  context.beginPath();
  context.arc(headX + B * 0.28, axisY, B * 0.16, 0, Math.PI * 2);
  context.fillStyle = metalDark;
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(headX + B * 0.28, axisY, B * 0.055, 0, Math.PI * 2);
  context.fillStyle = metalLight;
  context.fill();

  // Fixed body and sleeve.
  context.fillStyle = metalMid;
  context.fillRect(
    headX + B * 0.62,
    axisY - B * 0.47,
    sleeveStartX - (headX + B * 0.62),
    B * 0.94,
  );
  context.strokeRect(
    headX + B * 0.62,
    axisY - B * 0.47,
    sleeveStartX - (headX + B * 0.62),
    B * 0.94,
  );
  context.fillStyle = metalLight;
  context.beginPath();
  context.roundRect(
    sleeveStartX,
    sleeveTop,
    Math.max(B * 0.5, sleeveEndX - sleeveStartX + B * 0.16),
    sleeveRadius * 2,
    B * 0.16,
  );
  context.fill();
  context.stroke();
  context.fillStyle = metal;
  context.fillRect(
    sleeveStartX + 2,
    sleeveTop + B * 0.08,
    Math.max(0, sleeveEndX - sleeveStartX - 2),
    B * 0.08,
  );

  // Absolute internal scale, descending from 15 to 5 toward the thimble as
  // on the selected reference family. Half-millimetre marks alternate around
  // the datum and are clipped by the moving seam.
  context.save();
  context.beginPath();
  context.rect(
    sleeveStartX,
    sleeveTop,
    Math.max(1, sleeveEndX - sleeveStartX),
    sleeveBottom - sleeveTop,
  );
  context.clip();
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = Math.max(0.8, B * 0.013);
  context.beginPath();
  context.moveTo(sleeveStartX, referenceY);
  context.lineTo(sleeveEndX, referenceY);
  context.stroke();
  for (let markTicks = 1_500; markTicks >= 500; markTicks -= 50) {
    const x =
      scaleMaximumX + ((1_500 - markTicks) / 100) * pixelsPerMm;
    if (x > sleeveEndX + 1) continue;
    const whole = markTicks % 100 === 0;
    const tickHeight = whole ? B * 0.34 : B * 0.24;
    const direction = whole ? -1 : 1;
    context.beginPath();
    context.moveTo(x, referenceY);
    context.lineTo(x, referenceY + direction * tickHeight);
    context.stroke();
    if (whole && scaleNumbersVisible) {
      context.font = `650 ${Math.max(9, B * 0.18)}px Arial, sans-serif`;
      context.textAlign = "center";
      context.fillText(String(markTicks / 100), x, referenceY - B * 0.42);
    }
  }
  context.restore();

  // Cone, rotating thimble and procedural knurling.
  const thimbleGradient = context.createLinearGradient(
    0,
    thimbleTop,
    0,
    thimbleBottom,
  );
  thimbleGradient.addColorStop(0, metalDark);
  thimbleGradient.addColorStop(0.18, metalLight);
  thimbleGradient.addColorStop(0.5, metal);
  thimbleGradient.addColorStop(0.82, metalLight);
  thimbleGradient.addColorStop(1, metalDark);
  context.fillStyle = thimbleGradient;
  context.beginPath();
  context.moveTo(thimbleLeft, sleeveTop - B * 0.08);
  context.lineTo(thimbleLeft + B * 0.48, thimbleTop);
  context.lineTo(thimbleRight, thimbleTop);
  context.lineTo(thimbleRight, thimbleBottom);
  context.lineTo(thimbleLeft + B * 0.48, thimbleBottom);
  context.lineTo(thimbleLeft, sleeveBottom + B * 0.08);
  context.closePath();
  context.fill();
  context.strokeStyle = ink;
  context.stroke();

  const thimbleTickStep = Math.max(B * 0.105, 5.5);
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = Math.max(0.75, B * 0.012);
  for (let offset = -7; offset <= 7; offset += 1) {
    const division = (thimbleDivision + offset + 50) % 50;
    const y = referenceY + offset * thimbleTickStep;
    const major = division % 5 === 0;
    const length = major ? B * 0.42 : B * 0.25;
    context.beginPath();
    context.moveTo(thimbleLeft, y);
    context.lineTo(thimbleLeft + length, y);
    context.stroke();
    if (major && scaleNumbersVisible) {
      context.font = `650 ${Math.max(8, B * 0.16)}px Arial, sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(String(division), thimbleLeft + length + B * 0.08, y);
    }
  }
  context.strokeStyle = accent;
  context.lineWidth = Math.max(1.2, B * 0.02);
  context.beginPath();
  context.moveTo(thimbleLeft - B * 0.1, referenceY);
  context.lineTo(thimbleLeft + B * 0.72, referenceY);
  context.stroke();

  context.strokeStyle = dragging ? accent : ink;
  context.lineWidth = dragging ? Math.max(1.6, B * 0.025) : Math.max(1, B * 0.014);
  for (let x = thimbleLeft + B * 0.9; x < thimbleRight - B * 0.15; x += B * 0.18) {
    context.beginPath();
    context.moveTo(x, thimbleTop + B * 0.08);
    context.lineTo(x + B * 0.42, thimbleBottom - B * 0.08);
    context.stroke();
  }
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, B * 0.014);
  const ratchetGradient = context.createLinearGradient(ratchetLeft, 0, ratchetRight, 0);
  ratchetGradient.addColorStop(0, metalDark);
  ratchetGradient.addColorStop(0.5, metalLight);
  ratchetGradient.addColorStop(1, metalDark);
  context.fillStyle = ratchetGradient;
  context.fillRect(ratchetLeft, axisY - B * 0.72, ratchetRight - ratchetLeft, B * 1.44);
  context.strokeRect(ratchetLeft, axisY - B * 0.72, ratchetRight - ratchetLeft, B * 1.44);

  // Original local identification plate.
  const plateX = headX + B * 0.9;
  const plateY = axisY + B * 0.62;
  context.fillStyle = "#dededb";
  context.fillRect(plateX, plateY, B * 2.0, B * 0.62);
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, B * 0.012);
  context.strokeRect(plateX, plateY, B * 2.0, B * 0.62);
  context.fillStyle = accent;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.font = `750 ${Math.max(8, B * 0.16)}px Arial, sans-serif`;
  context.fillText("CABALERO", plateX + B, plateY + B * 0.25);
  context.fillStyle = ink;
  context.font = `620 ${Math.max(7, B * 0.13)}px Arial, sans-serif`;
  context.fillText("5–15 mm  ·  0,01 mm", plateX + B, plateY + B * 0.48);

  // Internal diameter dimension derived from the same integer reading.
  const dimensionX = contactCenterX - B * 0.68;
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineWidth = Math.max(1.2, B * 0.018);
  context.beginPath();
  context.moveTo(contactCenterX - B * 0.18, upperContactY);
  context.lineTo(dimensionX, upperContactY);
  context.moveTo(contactCenterX - B * 0.18, lowerContactY);
  context.lineTo(dimensionX, lowerContactY);
  context.moveTo(dimensionX, upperContactY);
  context.lineTo(dimensionX, lowerContactY);
  context.stroke();
  drawArrowHead(context, dimensionX, upperContactY, 1, Math.max(4, B * 0.09));
  drawArrowHead(context, dimensionX, lowerContactY, -1, Math.max(4, B * 0.09));
  const dimensionLabel = answerVisible
    ? readingLabel.replace(/\s+mm$/u, "")
    : "?";
  const labelX = Math.max(layout.originX + 10, dimensionX - B * 0.18);
  context.font = `600 ${Math.max(14, B * 0.28)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.save();
  context.translate(labelX, axisY);
  context.rotate(-Math.PI / 2);
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(3, B * 0.07);
  context.strokeText(dimensionLabel, 0, 0);
  context.fillStyle = ink;
  context.fillText(dimensionLabel, 0, 0);
  context.restore();
  context.restore();
}

function InstrumentSelector({
  activeInstrument,
  onInstrumentChange,
  className = "instrument-picker",
}: InstrumentNavigationProps & { readonly className?: string }) {
  return (
    <label className={className}>
      <span>Instrumento</span>
      <select
        aria-label="Instrumento de medição"
        value={activeInstrument}
        onChange={(event) =>
          onInstrumentChange(event.target.value as InstrumentId)
        }
      >
        <option value="caliper">Paquímetro universal</option>
        <option value="internal-micrometer">Micrômetro interno</option>
      </select>
    </label>
  );
}

export function InternalMicrometerWorkbench({
  activeInstrument,
  onInstrumentChange,
  initialSession,
  onSessionChange,
}: InternalMicrometerWorkbenchProps) {
  const [ticks, setTicks] = useState(() =>
    snapInternalMicrometerTicks(
      initialSession?.ticks ?? INITIAL_MICROMETER_TICKS,
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
  const lastMousePositionRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const reading = formatInternalMicrometerReading(ticks);
  const decomposition = decomposeInternalMicrometerReading(ticks);
  const breakdown = formatInternalMicrometerBreakdown(decomposition);
  const convertedReading = formatInternalMicrometerInches(ticks);

  useEffect(() => {
    onSessionChange?.({ ticks, answerVisible, scaleNumbersVisible });
  }, [answerVisible, onSessionChange, scaleNumbersVisible, ticks]);

  const setReading = useCallback((candidateTicks: number) => {
    setTicks(snapInternalMicrometerTicks(candidateTicks));
  }, []);

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
      drawInternalMicrometer(
        context,
        rect.width,
        rect.height,
        ticks,
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
  }, [answerVisible, detailMode, dragging, reading, scaleNumbersVisible, ticks]);

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
    if (event.pointerType !== "touch") {
      lastMousePositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    }
    if (
      event.button !== 0 ||
      activePointerRef.current !== null ||
      !pointerIsOnMovingAssembly(event)
    ) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const layout = getInternalMicrometerGeometry(rect.width, rect.height, ticks);
    const viewport = detailMode
      ? getDetailViewport(rect.width, rect.height, layout)
      : getCompactOverviewViewport(rect.width, rect.height, layout);
    const zoom = viewport?.zoom ?? 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    dragOriginRef.current = {
      clientX: event.clientX,
      ticks,
      ticksPerCssPixel:
        INTERNAL_MICROMETER_TICKS_PER_MM / (layout.pixelsPerMm * zoom),
    };
    setDragging(true);
    setMovingAssemblyHovered(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      const origin = dragOriginRef.current;
      if (!origin) return;
      const delta = event.clientX - origin.clientX;
      setReading(origin.ticks - delta * origin.ticksPerCssPixel);
      return;
    }
    if (event.pointerType !== "touch") {
      lastMousePositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
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
    const arrowStep = event.shiftKey ? 10 : 1;
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
        nextTicks -= INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS;
        break;
      case "PageUp":
        nextTicks += INTERNAL_MICROMETER_SPINDLE_PITCH_TICKS;
        break;
      case "Home":
        nextTicks = INTERNAL_MICROMETER_MIN_TICKS;
        break;
      case "End":
        nextTicks = INTERNAL_MICROMETER_MAX_TICKS;
        break;
      default:
        return;
    }
    event.preventDefault();
    setReading(nextTicks);
  };

  const randomize = () => {
    const next =
      INTERNAL_MICROMETER_MIN_TICKS +
      Math.floor(
        Math.random() *
          (INTERNAL_MICROMETER_MAX_TICKS -
            INTERNAL_MICROMETER_MIN_TICKS +
            1),
      );
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
      "Bainha e tambor ampliados. O micrômetro continua ajustável por arraste, toque ou teclado.",
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

  const ariaValue = internalMicrometerTicksToMm(ticks);

  return (
    <div className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a
          className="brand"
          href="#simulador-micrometro"
          aria-label="Cabalero Automações — micrômetro interno"
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
        id="simulador-micrometro"
        aria-labelledby="micrometer-title"
      >
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="micrometer-title">Micrômetro interno centesimal</h1>
            <InstrumentSelector
              className="stage-instrument-picker"
              activeInstrument={activeInstrument}
              onInstrumentChange={onInstrumentChange}
            />
          </div>
          <div className="stage-aside">
            <p className="interaction-hint micrometer-hint">
              <span aria-hidden="true">←</span>
              Arraste o tambor à esquerda para aumentar
            </p>
            <div className="readout" data-hidden={!answerVisible}>
              <div className="readout-label">
                <span>Medida interna</span>
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
                {answerVisible ? reading : "••••••"}
              </p>
              <p className="reading-breakdown">
                {answerVisible ? breakdown : "Resposta oculta para a turma"}
              </p>
            </div>
          </div>
        </div>

        <div className="instrument-stage micrometer-stage" data-detail={detailMode}>
          <button
            className="scale-numbers-control"
            type="button"
            data-hidden={!scaleNumbersVisible}
            aria-controls="micrometer-canvas"
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
            aria-controls="micrometer-canvas"
            aria-expanded={detailMode}
            aria-pressed={detailMode}
            aria-label={detailMode ? "Fechar ampliação" : "Ampliar bainha e tambor"}
            title={detailMode ? "Fechar ampliação (Esc)" : "Ampliar bainha e tambor"}
            onClick={toggleDetail}
          >
            {detailMode ? (
              <span className="close-symbol" aria-hidden="true" />
            ) : (
              <span className="magnifier-symbol" aria-hidden="true" />
            )}
          </button>
          <canvas
            id="micrometer-canvas"
            ref={canvasRef}
            className={`caliper-canvas micrometer-canvas${movingAssemblyHovered ? " is-interactive" : ""}${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label={`Ajustar o micrômetro interno. Faixa de 5 a 15 milímetros. Resolução ${INTERNAL_MICROMETER_PROFILE.label}.${detailMode ? " Escala ampliada." : ""}`}
            aria-valuemin={5}
            aria-valuemax={15}
            aria-valuenow={ariaValue}
            aria-valuetext={answerVisible ? reading : "Resposta oculta"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onLostPointerCapture={cancelPointer}
            onPointerLeave={() => {
              if (!dragging) {
                lastMousePositionRef.current = null;
                setMovingAssemblyHovered(false);
              }
            }}
            onKeyDown={onKeyDown}
          >
            Simulador de micrômetro interno. Use os controles para definir a medida.
          </canvas>
          <div className="stage-legend" aria-hidden="true">
            <span><i className="legend-fixed" /> bainha fixa</span>
            <span><i className="legend-moving" /> tambor móvel</span>
          </div>
        </div>

        <div
          className="control-deck micrometer-control-deck"
          aria-label="Controles do micrômetro interno"
        >
          <div className="micrometer-specification">
            <span>Perfil do instrumento</span>
            <strong>Milímetro · 0,01 mm</strong>
            <small>Faixa nominal 5–15 mm</small>
          </div>
          <div className="micrometer-step-controls" aria-label="Ajuste fino">
            <button
              className="secondary-button"
              type="button"
              disabled={ticks === INTERNAL_MICROMETER_MIN_TICKS}
              aria-label="Diminuir 0,01 milímetro"
              onClick={() => setReading(ticks - 1)}
            >
              − <span>0,01</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={ticks === INTERNAL_MICROMETER_MAX_TICKS}
              aria-label="Aumentar 0,01 milímetro"
              onClick={() => setReading(ticks + 1)}
            >
              + <span>0,01</span>
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
              onClick={() => setReading(INTERNAL_MICROMETER_MIN_TICKS)}
            >
              <span className="button-icon" aria-hidden="true">↺</span>
              Ir ao mínimo
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

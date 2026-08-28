"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  PROTRACTOR_MAX_ARC_MINUTES,
  PROTRACTOR_MIN_ARC_MINUTES,
  PROTRACTOR_RESOLUTION_ARC_MINUTES,
  PROTRACTOR_MIN_READING_DEGREES,
  PROTRACTOR_SWEEP_DEGREES,
  SEMICIRCULAR_PROTRACTOR_PROFILE,
  decomposeSemicircularProtractorReading,
  formatSemicircularProtractorBreakdown,
  formatSemicircularProtractorComplement,
  formatSemicircularProtractorReading,
  formatSemicircularProtractorReadingAccessible,
  getRandomSemicircularProtractorArcMinutes,
  snapSemicircularProtractorArcMinutes,
  stepSemicircularProtractorArcMinutes,
} from "../../lib/semicircular-protractor";
import {
  getProtractorDetailPresentation,
  getProtractorScalePoint,
  getSemicircularProtractorGeometry,
  type SemicircularProtractorGeometry,
} from "../../lib/semicircular-protractor-geometry";
import {
  distanceToSegment,
  getSemicircularProtractorArcMinutesFromPointer,
  getSemicircularProtractorDetailDragArcMinutes,
  isPointerOutsideProtractorDeadZone,
} from "../../lib/semicircular-protractor-interaction";
import { InstrumentSelector } from "./InstrumentSelector";
import type { InstrumentNavigationProps } from "./instrument-types";

const INITIAL_PROTRACTOR_ARC_MINUTES = 30 * 60 + 25;

export interface SemicircularProtractorSessionState {
  readonly arcMinutes: number;
  readonly answerVisible: boolean;
  readonly scaleNumbersVisible: boolean;
}

interface SemicircularProtractorWorkbenchProps
  extends InstrumentNavigationProps {
  readonly initialSession?: SemicircularProtractorSessionState;
  readonly onSessionChange?: (
    session: SemicircularProtractorSessionState,
  ) => void;
}

function drawScaleLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  degrees: number,
  fontPx: number,
  rotationDegrees = degrees - 90,
) {
  context.save();
  context.translate(x, y);
  context.rotate((rotationDegrees * Math.PI) / 180);
  context.fillStyle = "#303235";
  context.font = `650 ${fontPx}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 0, 0);
  context.restore();
}

function drawBlade(
  context: CanvasRenderingContext2D,
  layout: SemicircularProtractorGeometry,
  dragging: boolean,
) {
  const ux = (layout.bladePointerX - layout.pivotX) / layout.pointerLength;
  const uy = (layout.bladePointerY - layout.pivotY) / layout.pointerLength;
  const px = -uy;
  const py = ux;
  const halfWidth = layout.bladeWidth / 2;
  const shoulderX = layout.bladePointerX - ux * Math.max(12, layout.B * 0.8);
  const shoulderY = layout.bladePointerY - uy * Math.max(12, layout.B * 0.8);
  const blade = new Path2D();
  blade.moveTo(layout.bladePointerX, layout.bladePointerY);
  blade.lineTo(shoulderX + px * halfWidth, shoulderY + py * halfWidth);
  blade.lineTo(
    layout.bladeTailX + px * halfWidth,
    layout.bladeTailY + py * halfWidth,
  );
  blade.lineTo(
    layout.bladeTailX - px * halfWidth,
    layout.bladeTailY - py * halfWidth,
  );
  blade.lineTo(shoulderX - px * halfWidth, shoulderY - py * halfWidth);
  blade.closePath();

  const gradient = context.createLinearGradient(
    layout.pivotX + px * halfWidth,
    layout.pivotY + py * halfWidth,
    layout.pivotX - px * halfWidth,
    layout.pivotY - py * halfWidth,
  );
  gradient.addColorStop(0, dragging ? "#f4dfe7" : "#f6f6f4");
  gradient.addColorStop(0.48, dragging ? "#c9a5b3" : "#c7c8c6");
  gradient.addColorStop(1, "#858784");
  context.fillStyle = gradient;
  context.fill(blade);
  context.strokeStyle = "#444744";
  context.lineWidth = Math.max(1.2, layout.B * 0.11);
  context.stroke(blade);

  context.strokeStyle = "#8a1745";
  context.lineWidth = Math.max(1.5, layout.B * 0.13);
  context.beginPath();
  context.moveTo(layout.pivotX, layout.pivotY);
  context.lineTo(layout.bladePointerX, layout.bladePointerY);
  context.stroke();
}

function drawSemicircularProtractor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  arcMinutes: number,
  dragging: boolean,
  scaleNumbersVisible: boolean,
) {
  const layout = getSemicircularProtractorGeometry(width, height, arcMinutes);
  context.clearRect(0, 0, width, height);

  const body = new Path2D();
  body.moveTo(layout.baseStartX, layout.pivotY);
  body.arc(
    layout.pivotX,
    layout.pivotY,
    layout.outerRadius,
    Math.PI,
    Math.PI * 2,
  );
  body.lineTo(layout.baseStartX, layout.pivotY);
  body.closePath();
  const bodyGradient = context.createLinearGradient(
    0,
    layout.pivotY - layout.outerRadius,
    0,
    layout.pivotY,
  );
  bodyGradient.addColorStop(0, "#fbfbfa");
  bodyGradient.addColorStop(1, "#e1e2df");
  context.fillStyle = bodyGradient;
  context.fill(body);
  context.strokeStyle = "#4b4e4d";
  context.lineWidth = Math.max(1.4, layout.B * 0.12);
  context.stroke(body);

  const labelInterval = layout.outerRadius < 180 ? 20 : 10;

  context.strokeStyle = "rgba(138, 23, 69, 0.22)";
  context.lineWidth = Math.max(5, layout.B * 0.38);
  context.beginPath();
  context.arc(
    layout.pivotX,
    layout.pivotY,
    layout.outerRadius * 0.42,
    Math.PI,
    Math.PI + (layout.angleDegrees * Math.PI) / 180,
  );
  context.stroke();

  for (let mark = 0; mark <= PROTRACTOR_SWEEP_DEGREES; mark += 1) {
    const isTen = mark % 10 === 0;
    const isFive = mark % 5 === 0;
    const tickLength = layout.outerRadius * (isTen ? 0.105 : isFive ? 0.075 : 0.045);
    const outer = getProtractorScalePoint(layout, mark);
    const inner = getProtractorScalePoint(
      layout,
      mark,
      layout.outerRadius - tickLength,
    );
    context.strokeStyle = isTen ? "#25282a" : "#606361";
    context.lineWidth = isTen ? Math.max(1.25, layout.B * 0.09) : 1;
    context.beginPath();
    context.moveTo(outer.x, outer.y);
    context.lineTo(inner.x, inner.y);
    context.stroke();
    if (mark % labelInterval === 0 && scaleNumbersVisible) {
      const endpoint = mark === 0 || mark === PROTRACTOR_SWEEP_DEGREES;
      const label = endpoint
        ? {
            x:
              mark === 0
                ? layout.baseStartX + Math.max(14, layout.B * 0.9)
                : layout.baseEndX - Math.max(14, layout.B * 0.9),
            y: layout.pivotY - Math.max(12, layout.B * 0.72),
          }
        : getProtractorScalePoint(layout, mark, layout.labelRadius);
      drawScaleLabel(
        context,
        String(mark === 0 ? PROTRACTOR_MIN_READING_DEGREES : mark),
        label.x,
        label.y,
        mark,
        endpoint
          ? Math.max(9, Math.min(13, layout.B * 0.82))
          : Math.max(10, Math.min(15, layout.B * 0.92)),
        endpoint ? 0 : mark - 90,
      );
    }
  }

  const selectedOuter = getProtractorScalePoint(layout, layout.angleDegrees);
  const selectedInner = getProtractorScalePoint(
    layout,
    layout.angleDegrees,
    layout.outerRadius * 0.85,
  );
  context.strokeStyle = "#8a1745";
  context.lineWidth = Math.max(2, layout.B * 0.18);
  context.beginPath();
  context.moveTo(selectedOuter.x, selectedOuter.y);
  context.lineTo(selectedInner.x, selectedInner.y);
  context.stroke();

  context.fillStyle = "#5d605f";
  context.font = `650 ${Math.max(10, Math.min(14, layout.B * 0.86))}px Arial, sans-serif`;
  context.textAlign = "center";
  context.fillText(
    "CABALERO · 5–180°",
    layout.pivotX,
    layout.pivotY - layout.outerRadius * 0.16,
  );

  drawBlade(context, layout, dragging);
  const hubRadius = layout.hubRadius;
  const hub = context.createRadialGradient(
    layout.pivotX - hubRadius * 0.3,
    layout.pivotY - hubRadius * 0.3,
    1,
    layout.pivotX,
    layout.pivotY,
    hubRadius,
  );
  hub.addColorStop(0, "#f7f7f5");
  hub.addColorStop(1, "#777a78");
  context.fillStyle = hub;
  context.beginPath();
  context.arc(layout.pivotX, layout.pivotY, hubRadius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#474a48";
  context.lineWidth = 1;
  context.stroke();
}

function drawMagnifiedScale(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  arcMinutes: number,
  answerVisible: boolean,
  scaleNumbersVisible: boolean,
) {
  const detail = getProtractorDetailPresentation(width, height, arcMinutes);
  const reading = decomposeSemicircularProtractorReading(arcMinutes);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#343638";
  context.font = `750 ${Math.max(12, Math.min(15, width / 48))}px Arial, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("ESCALA AMPLIADA · 5′ POR TRAÇO", detail.left, detail.top - 28);
  if (width >= 900) {
    context.textAlign = "center";
    context.font = `650 ${Math.max(11, Math.min(13, width / 58))}px Arial, sans-serif`;
    context.fillText(
      "12 DIVISÕES = 1°",
      detail.right - Math.min(220, width * 0.17),
      detail.top - 28,
    );
  }

  context.fillStyle = "#f4f4f2";
  context.strokeStyle = "#c8cbc8";
  context.lineWidth = 1.2;
  context.beginPath();
  context.roundRect(
    detail.left,
    detail.top,
    detail.right - detail.left,
    detail.bottom - detail.top,
    10,
  );
  context.fill();
  context.stroke();

  context.save();
  context.beginPath();
  context.rect(
    detail.left + 1,
    detail.top + 1,
    detail.right - detail.left - 2,
    detail.bottom - detail.top - 2,
  );
  context.clip();
  context.strokeStyle = "#404341";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(detail.left, detail.baselineY);
  context.lineTo(detail.right, detail.baselineY);
  context.stroke();

  for (
    let offset = -detail.visibleStepRadius;
    offset <= detail.visibleStepRadius;
    offset += 1
  ) {
    const markArcMinutes =
      reading.totalArcMinutes + offset * PROTRACTOR_RESOLUTION_ARC_MINUTES;
    if (
      markArcMinutes < PROTRACTOR_MIN_ARC_MINUTES ||
      markArcMinutes > PROTRACTOR_MAX_ARC_MINUTES
    ) continue;
    const x = detail.centerX + offset * detail.minuteStepPitch;
    if (
      x < detail.left + detail.minuteStepPitch * 0.42 ||
      x > detail.right - detail.minuteStepPitch * 0.42
    ) {
      continue;
    }
    const minutesWithinDegree = markArcMinutes % 60;
    const isDegree = minutesWithinDegree === 0;
    const isQuarterDegree = minutesWithinDegree % 15 === 0;
    const tickHeight = isDegree ? 58 : isQuarterDegree ? 42 : 25;
    context.strokeStyle = offset === 0 ? "#8a1745" : "#343735";
    context.lineWidth = offset === 0 ? 3 : isDegree ? 2.2 : isQuarterDegree ? 1.6 : 1.1;
    context.beginPath();
    context.moveTo(x, detail.baselineY - tickHeight);
    context.lineTo(x, detail.baselineY + 8);
    context.stroke();
    const labelFits = x >= detail.left + 24 && x <= detail.right - 24;
    if (
      scaleNumbersVisible &&
      labelFits &&
      (isDegree || isQuarterDegree)
    ) {
      context.fillStyle = offset === 0 ? "#74123a" : "#2f3230";
      context.font = `${offset === 0 ? 780 : 650} ${isDegree ? 15 : 12}px "Geist Mono", monospace`;
      context.textAlign = "center";
      context.fillText(
        isDegree ? `${markArcMinutes / 60}°` : `${minutesWithinDegree}′`,
        x,
        detail.baselineY + (isDegree ? 36 : 30),
      );
    }
  }
  context.restore();

  context.fillStyle = "#8a1745";
  context.beginPath();
  context.moveTo(detail.centerX - 9, detail.top + 10);
  context.lineTo(detail.centerX + 9, detail.top + 10);
  context.lineTo(detail.centerX, detail.top + 24);
  context.closePath();
  context.fill();
  context.strokeStyle = "#8a1745";
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(detail.centerX, detail.top + 20);
  context.lineTo(detail.centerX, detail.baselineY - 58);
  context.stroke();

  context.fillStyle = "#555957";
  context.font = `600 ${Math.max(12, Math.min(15, width / 48))}px Arial, sans-serif`;
  context.textAlign = "center";
  const footer = answerVisible
    ? `Correspondente ${formatSemicircularProtractorReading(reading.totalArcMinutes)} · complementar ${formatSemicircularProtractorComplement(reading.complementaryArcMinutes)}`
    : "Resposta oculta · leia graus e minutos sob o ponteiro central";
  context.fillText(footer, width / 2, detail.bottom + 28);
}

function isPointOnBlade(
  x: number,
  y: number,
  layout: SemicircularProtractorGeometry,
) {
  const onHub =
    Math.hypot(x - layout.pivotX, y - layout.pivotY) <= layout.hitRadius;
  const onBlade =
    distanceToSegment(
      x,
      y,
      layout.bladePointerX,
      layout.bladePointerY,
      layout.bladeTailX,
      layout.bladeTailY,
    ) <= Math.max(22, layout.bladeWidth * 1.5);
  return onHub || onBlade;
}

export function SemicircularProtractorWorkbench({
  activeInstrument,
  onInstrumentChange,
  initialSession,
  onSessionChange,
}: SemicircularProtractorWorkbenchProps) {
  const [arcMinutes, setArcMinutes] = useState(() =>
    snapSemicircularProtractorArcMinutes(
      initialSession?.arcMinutes ?? INITIAL_PROTRACTOR_ARC_MINUTES,
    ),
  );
  const [answerVisible, setAnswerVisible] = useState(
    initialSession?.answerVisible ?? true,
  );
  const [scaleNumbersVisible, setScaleNumbersVisible] = useState(
    initialSession?.scaleNumbersVisible ?? true,
  );
  const [dragging, setDragging] = useState(false);
  const [bladeHovered, setBladeHovered] = useState(false);
  const [detailMode, setDetailMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detailButtonRef = useRef<HTMLButtonElement>(null);
  const labRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const detailDragRef = useRef<{
    originX: number;
    originArcMinutes: number;
  } | null>(null);

  const reading = formatSemicircularProtractorReading(arcMinutes);
  const breakdown = formatSemicircularProtractorBreakdown(arcMinutes);
  const decomposition = decomposeSemicircularProtractorReading(arcMinutes);
  const accessibleReading =
    formatSemicircularProtractorReadingAccessible(arcMinutes);

  useEffect(() => {
    onSessionChange?.({ arcMinutes, answerVisible, scaleNumbersVisible });
  }, [answerVisible, arcMinutes, onSessionChange, scaleNumbersVisible]);

  const cancelPointer = useCallback(() => {
    activePointerRef.current = null;
    detailDragRef.current = null;
    setDragging(false);
    setBladeHovered(false);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailMode(false);
    setAnnouncement("Lupa fechada. Transferidor completo restaurado.");
    window.requestAnimationFrame(() => detailButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === labRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
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
      if (detailMode) {
        drawMagnifiedScale(
          context,
          rect.width,
          rect.height,
          arcMinutes,
          answerVisible,
          scaleNumbersVisible,
        );
      } else {
        drawSemicircularProtractor(
          context,
          rect.width,
          rect.height,
          arcMinutes,
          dragging,
          scaleNumbersVisible,
        );
      }
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
  }, [answerVisible, arcMinutes, detailMode, dragging, scaleNumbersVisible]);

  const pointForEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      rect,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const pointerIsOnBlade = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (detailMode) return true;
    const point = pointForEvent(event);
    const layout = getSemicircularProtractorGeometry(
      point.rect.width,
      point.rect.height,
      arcMinutes,
    );
    return isPointOnBlade(point.x, point.y, layout);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      event.button !== 0 ||
      activePointerRef.current !== null ||
      !pointerIsOnBlade(event)
    ) {
      return;
    }
    const point = pointForEvent(event);
    if (!detailMode) {
      const layout = getSemicircularProtractorGeometry(
        point.rect.width,
        point.rect.height,
        arcMinutes,
      );
      if (
        !isPointerOutsideProtractorDeadZone(
          point.x,
          point.y,
          layout.pivotX,
          layout.pivotY,
          layout.deadZoneRadius,
        )
      ) {
        return;
      }
    } else {
      detailDragRef.current = {
        originX: event.clientX,
        originArcMinutes: arcMinutes,
      };
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    setDragging(true);
    setBladeHovered(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      const point = pointForEvent(event);
      if (detailMode) {
        const drag = detailDragRef.current;
        if (!drag) return;
        const detail = getProtractorDetailPresentation(
          point.rect.width,
          point.rect.height,
          drag.originArcMinutes,
        );
        setArcMinutes(
          getSemicircularProtractorDetailDragArcMinutes(
            drag.originArcMinutes,
            event.clientX - drag.originX,
            detail.minuteStepPitch,
          ),
        );
      } else {
        const layout = getSemicircularProtractorGeometry(
          point.rect.width,
          point.rect.height,
          arcMinutes,
        );
        setArcMinutes(
          getSemicircularProtractorArcMinutesFromPointer(
            point.x,
            point.y,
            layout.pivotX,
            layout.pivotY,
          ),
        );
      }
      return;
    }
    if (event.pointerType !== "touch") {
      setBladeHovered(pointerIsOnBlade(event));
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerRef.current = null;
    detailDragRef.current = null;
    setDragging(false);
    setBladeHovered(
      event.pointerType !== "touch" && pointerIsOnBlade(event),
    );
    setAnnouncement(
      answerVisible ? `Ângulo ajustado para ${reading}.` : "Ângulo ajustado.",
    );
  };

  const changeBySteps = (deltaSteps: number) => {
    setArcMinutes((current) =>
      stepSemicircularProtractorArcMinutes(current, deltaSteps),
    );
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
        changeBySteps(-120);
        break;
      case "PageUp":
        changeBySteps(120);
        break;
      case "Home":
        setArcMinutes(PROTRACTOR_MIN_ARC_MINUTES);
        break;
      case "End":
        setArcMinutes(PROTRACTOR_MAX_ARC_MINUTES);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const randomize = () => {
    setArcMinutes(getRandomSemicircularProtractorArcMinutes());
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
      "Lupa aberta. O ponteiro central mostra graus e minutos; cada traço vale cinco minutos.",
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
          ? "Números da escala ocultados. Os traços permanecem visíveis."
          : "Números da escala exibidos.",
      );
      return !visible;
    });
  };

  return (
    <div className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a
          className="brand"
          href="#simulador-transferidor"
          aria-label="Cabalero Automações — transferidor semicircular"
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
          <button
            className="icon-text-button"
            type="button"
            onClick={toggleFullscreen}
          >
            <span aria-hidden="true">⛶</span>
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
        </div>
      </header>

      <section
        className="workbench"
        id="simulador-transferidor"
        aria-labelledby="protractor-title"
      >
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="protractor-title">Transferidor semicircular</h1>
            <InstrumentSelector
              className="stage-instrument-picker"
              compactLabel
              activeInstrument={activeInstrument}
              onInstrumentChange={onInstrumentChange}
            />
          </div>
          <div className="stage-aside">
            <p className="interaction-hint goniometer-hint">
              <span aria-hidden="true">↗</span>
              {detailMode
                ? "Arraste a escala sob o ponteiro"
                : "Arraste a régua · passo de 5′"}
            </p>
            <div className="readout" data-hidden={!answerVisible}>
              <div className="readout-label">
                <span>Ângulo correspondente</span>
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
                {answerVisible ? reading : "••••"}
              </p>
              <p className="reading-breakdown">
                {answerVisible ? breakdown : "Resposta oculta para a turma"}
              </p>
            </div>
          </div>
        </div>

        <div
          className="instrument-stage goniometer-stage protractor-stage"
          data-detail={detailMode}
        >
          <button
            className="scale-numbers-control"
            type="button"
            data-hidden={!scaleNumbersVisible}
            aria-controls="protractor-canvas"
            aria-pressed={!scaleNumbersVisible}
            aria-label={
              scaleNumbersVisible
                ? "Ocultar números da escala"
                : "Mostrar números da escala"
            }
            title={
              scaleNumbersVisible
                ? "Ocultar números da escala"
                : "Mostrar números da escala"
            }
            onClick={toggleScaleNumbers}
          >
            <span className="scale-numbers-symbol" aria-hidden="true">
              123
            </span>
          </button>
          <button
            ref={detailButtonRef}
            className={`detail-control${detailMode ? " is-active" : ""}`}
            type="button"
            aria-controls="protractor-canvas"
            aria-expanded={detailMode}
            aria-pressed={detailMode}
            aria-label={detailMode ? "Fechar lupa" : "Ampliar leitura"}
            title={detailMode ? "Fechar lupa (Esc)" : "Ampliar leitura"}
            onClick={toggleDetail}
          >
            {detailMode ? (
              <span className="close-symbol" aria-hidden="true" />
            ) : (
              <span className="magnifier-symbol" aria-hidden="true" />
            )}
          </button>
          <canvas
            id="protractor-canvas"
            ref={canvasRef}
            className={`caliper-canvas goniometer-canvas protractor-canvas${bladeHovered ? " is-interactive" : ""}${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label={`Ajustar o transferidor semicircular. Faixa de cinco a cento e oitenta graus. Resolução ${SEMICIRCULAR_PROTRACTOR_PROFILE.label}.${detailMode ? " Leitura ampliada." : ""}`}
            aria-valuemin={PROTRACTOR_MIN_ARC_MINUTES}
            aria-valuemax={PROTRACTOR_MAX_ARC_MINUTES}
            aria-valuenow={arcMinutes}
            aria-valuetext={answerVisible ? accessibleReading : "Resposta oculta"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onLostPointerCapture={cancelPointer}
            onPointerLeave={() => {
              if (!dragging) setBladeHovered(false);
            }}
            onKeyDown={onKeyDown}
          >
            Simulador de transferidor semicircular. Use os controles para definir
            o ângulo.
          </canvas>
          <div className="stage-legend" aria-hidden="true">
            <span>
              <i className="legend-fixed" /> corpo e escala fixos
            </span>
            <span>
              <i className="legend-moving" /> régua e ponteiro móveis
            </span>
          </div>
        </div>

        <div
          className="control-deck micrometer-control-deck goniometer-control-deck"
          aria-label="Controles do transferidor semicircular"
        >
          <div className="micrometer-specification">
            <span>Perfil do instrumento</span>
            <strong>Semicircular · leitura direta</strong>
            <small>Faixa 5–180° · lupa em 5′ · sem nônio</small>
          </div>
          <div
            className="micrometer-step-controls"
            aria-label="Ajuste fino angular"
          >
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
                ? `Ângulo complementar: ${decomposition.complementaryDegrees} graus e ${decomposition.complementaryMinutes} minutos`
                : "Ângulo complementar oculto junto com a resposta"
            }
          >
            <span>Complementar</span>
            <strong>
              {answerVisible
                ? formatSemicircularProtractorComplement(
                    decomposition.complementaryArcMinutes,
                  )
                : "••••"}
            </strong>
          </output>
          <div className="practice-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setArcMinutes(PROTRACTOR_MIN_ARC_MINUTES)}
            >
              <span className="button-icon" aria-hidden="true">
                ↺
              </span>
              Ir a 5°
            </button>
            <button
              className="primary-button"
              type="button"
              aria-label="Sortear ângulo e ocultar resposta"
              onClick={randomize}
            >
              <span className="button-icon" aria-hidden="true">
                ⚄
              </span>
              <span className="button-label-wide">Sortear e ocultar</span>
              <span className="button-label-compact" aria-hidden="true">
                Sortear
              </span>
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

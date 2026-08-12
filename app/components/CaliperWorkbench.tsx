"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CALIPER_SCALES,
  CALIPER_TICKS_PER_MM,
  DEFAULT_CALIPER_MAX_TICKS,
  type CaliperScale,
  type CaliperScaleId,
  type MeasurementUnit,
  formatCaliperReading,
  formatFractionalInches,
  getCaliperScalesForUnit,
  mmToTicks,
  snapCaliperTicks,
  ticksToInches,
  ticksToMm,
} from "../../lib/caliper";

const INITIAL_TICKS = mmToTicks(58.35);

const SCALE_NOTES: Record<CaliperScaleId, string> = {
  "mm-0.1": "nônio decimal · 10 divisões",
  "mm-0.05": "cinco centésimos · 20 divisões",
  "mm-0.02": "dois centésimos · 50 divisões",
  "in-1/128": "polegada fracionária · 8 divisões",
  "in-0.001": "polegada milesimal · 25 divisões",
};

interface Geometry {
  side: number;
  fixedContactX: number;
  mainZeroX: number;
  scaleToContactOffset: number;
  pixelsPerMm: number;
  beamEnd: number;
}

function getGeometry(width: number): Geometry {
  const side = Math.min(24, Math.max(8, width * 0.012));
  const fixedJawWidth = Math.min(78, Math.max(44, width * 0.061));
  const scaleToContactOffset = Math.min(68, Math.max(34, width * 0.052));
  const endReserve = Math.min(78, Math.max(42, width * 0.052));
  const fixedContactX = side + fixedJawWidth;
  const mainZeroX = fixedContactX + scaleToContactOffset;
  const beamEnd = width - side;
  const usableWidth = Math.max(
    180,
    beamEnd - mainZeroX - endReserve,
  );

  return {
    side,
    fixedContactX,
    mainZeroX,
    scaleToContactOffset,
    pixelsPerMm: usableWidth / 150,
    beamEnd,
  };
}

function fractionToNumber(fraction: CaliperScale["mainScaleDivision"]): number {
  return fraction.numerator / fraction.denominator;
}

function drawInstrument(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  ticks: number,
  scale: CaliperScale,
  dragging: boolean,
  detailMode: boolean,
) {
  const {
    side,
    fixedContactX,
    mainZeroX,
    scaleToContactOffset,
    pixelsPerMm,
    beamEnd,
  } = getGeometry(width);
  const valueMm = ticksToMm(ticks);
  const movingScaleZeroX = mainZeroX + valueMm * pixelsPerMm;
  const movingContactX = movingScaleZeroX - scaleToContactOffset;
  const beamY = Math.min(192, Math.max(116, height * 0.27));
  const beamHeight = Math.min(118, Math.max(78, height * 0.17));
  const beamBottom = beamY + beamHeight;
  const jawBottom = Math.min(
    height - 54,
    beamBottom + beamHeight * 2.65,
  );
  const upperTipY = Math.max(18, beamY - beamHeight * 1.34);
  const metal = "#c8c8c6";
  const metalLight = "#eeeeec";
  const metalMid = "#aaa9a7";
  const metalDark = "#6f6e6d";
  const ink = "#181619";
  const fineInk = "#3c383b";
  const accent = "#7c2145";

  context.clearRect(0, 0, width, height);
  context.save();
  if (detailMode) {
    const zoom = 1.55;
    const detailY = beamY + beamHeight * 0.72;
    context.translate(width * 0.5, height * 0.56);
    context.scale(zoom, zoom);
    context.translate(-movingScaleZeroX, -detailY);
  }
  context.lineJoin = "round";
  context.lineCap = "square";

  // Depth rod behind the beam.
  context.fillStyle = metalLight;
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  const depthRodX = Math.min(beamEnd - 3, movingScaleZeroX + 42);
  const depthRodWidth = Math.max(0, beamEnd - depthRodX + side * 0.8);
  context.fillRect(depthRodX, beamY + 22, depthRodWidth, 12);
  context.strokeRect(depthRodX, beamY + 22, depthRodWidth, 12);

  // Main beam.
  context.fillStyle = metal;
  context.fillRect(side, beamY, beamEnd - side, beamHeight);
  context.strokeStyle = ink;
  context.lineWidth = 2;
  context.strokeRect(side, beamY, beamEnd - side, beamHeight);
  context.fillStyle = metalMid;
  context.fillRect(side + 2, beamY + 3, beamEnd - side - 4, 6);
  context.fillStyle = "#dededb";
  context.fillRect(side + 2, beamBottom - 9, beamEnd - side - 4, 7);

  // Fixed external jaw: broad frame, narrow contact face and a long relieved leg.
  context.beginPath();
  context.moveTo(side, beamBottom - 7);
  context.lineTo(fixedContactX + 10, beamBottom - 7);
  context.lineTo(fixedContactX + 10, beamBottom + 34);
  context.lineTo(fixedContactX, beamBottom + 38);
  context.lineTo(fixedContactX, jawBottom - 22);
  context.quadraticCurveTo(
    fixedContactX - 5,
    jawBottom - 3,
    fixedContactX - 22,
    jawBottom,
  );
  context.lineTo(side + Math.min(44, Math.max(30, width * 0.034)), jawBottom);
  context.quadraticCurveTo(side + 22, jawBottom - 4, side + 17, jawBottom - 29);
  context.lineTo(side, beamBottom + 7);
  context.closePath();
  context.fillStyle = metal;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(fixedContactX - 7, beamBottom + 35, 7, Math.max(22, jawBottom - beamBottom - 57));

  // Fixed internal jaw.
  const fixedJawSpan = fixedContactX - side;
  const fixedInternalFaceX = side + fixedJawSpan * 0.48;
  const internalShelfY = beamY - beamHeight * 0.34;
  context.beginPath();
  context.moveTo(side, beamY + 1);
  context.lineTo(side, internalShelfY);
  context.lineTo(fixedInternalFaceX, internalShelfY);
  context.lineTo(fixedInternalFaceX, upperTipY);
  context.quadraticCurveTo(
    fixedContactX,
    upperTipY + beamHeight * 0.58,
    fixedContactX,
    internalShelfY,
  );
  context.lineTo(fixedContactX, beamY + 1);
  context.closePath();
  context.fillStyle = metal;
  context.fill();
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(fixedContactX - 7, internalShelfY, 7, beamY - internalShelfY);

  // Moving external jaw. Its long shoulder and tapered leg follow the
  // proportions of a universal caliper while preserving the exact contact.
  const movingJawShoulder = movingContactX + Math.min(142, Math.max(82, width * 0.09));
  const movingJawHeel = movingContactX + Math.min(108, Math.max(58, width * 0.07));
  const movingJawTop = beamBottom + beamHeight * 0.25;
  context.beginPath();
  context.moveTo(movingContactX, movingJawTop);
  context.lineTo(movingJawShoulder, movingJawTop);
  context.lineTo(movingJawShoulder, movingJawTop + beamHeight * 0.23);
  context.lineTo(movingJawShoulder - 9, movingJawTop + beamHeight * 0.27);
  context.lineTo(movingJawHeel, jawBottom - 28);
  context.quadraticCurveTo(
    movingJawHeel - 5,
    jawBottom - 3,
    movingContactX + 22,
    jawBottom,
  );
  context.lineTo(movingContactX, jawBottom);
  context.closePath();
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(movingContactX, movingJawTop + 1, 7, Math.max(22, jawBottom - movingJawTop - 1));

  // Moving internal jaw.
  const movingInternalRootX = movingContactX - fixedJawSpan;
  const movingInternalFaceX = movingContactX - fixedJawSpan * 0.52;
  context.beginPath();
  context.moveTo(movingInternalRootX, beamY + 1);
  context.lineTo(movingInternalRootX, internalShelfY);
  context.quadraticCurveTo(
    movingInternalRootX,
    upperTipY + beamHeight * 0.58,
    movingInternalFaceX,
    upperTipY,
  );
  context.lineTo(movingInternalFaceX, internalShelfY);
  context.lineTo(movingScaleZeroX, internalShelfY);
  context.lineTo(movingScaleZeroX, beamY + 1);
  context.closePath();
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill();
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(movingInternalRootX, internalShelfY, 7, beamY - internalShelfY);

  // The reference cursor is a long bridge: an upper vernier plate and a
  // separate lower carriage. Their shared width is capped near the beam end.
  const requestedSliderWidth = Math.min(445, Math.max(178, width * 0.26));
  const sliderRight = Math.min(
    beamEnd - 8,
    movingScaleZeroX + requestedSliderWidth,
  );
  const sliderTop = beamY - beamHeight * 0.42;
  const upperPlateLeft = movingContactX + Math.min(12, scaleToContactOffset * 0.18);
  const upperPlateBottom = beamY + beamHeight * 0.18;
  const vernierTop = beamY + beamHeight * 0.82;
  const vernierBottom = vernierTop + beamHeight * 0.43;

  // Main scale.
  const isMetric = scale.unit === "mm";
  const mainDivisionInMm = isMetric
    ? fractionToNumber(scale.mainScaleDivision)
    : fractionToNumber(scale.mainScaleDivision) * 25.4;
  const mainTickCount = Math.floor(150 / mainDivisionInMm);
  const scaleBaseY = beamY + beamHeight * 0.62;
  const mainLabelY = beamY + beamHeight * 0.48;
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = Math.max(0.8, Math.min(1.35, width / 980));

  for (let index = 0; index <= mainTickCount; index += 1) {
    const x = mainZeroX + index * mainDivisionInMm * pixelsPerMm;
    if (x > beamEnd - 5) break;

    let tickHeight = 13;
    let label: string | null = null;

    if (isMetric) {
      const millimetres = index * mainDivisionInMm;
      if (Math.abs(millimetres % 10) < 0.0001) {
        tickHeight = beamHeight * 0.36;
        label = millimetres <= 100
          ? String(Math.round(millimetres / 10))
          : null;
      } else if (Math.abs(millimetres % 5) < 0.0001) {
        tickHeight = beamHeight * 0.28;
      }
    } else if (scale.id === "in-1/128") {
      if (index % 16 === 0) {
        tickHeight = beamHeight * 0.36;
        label = String(index / 16);
      } else if (index % 8 === 0) {
        tickHeight = beamHeight * 0.29;
      } else if (index % 4 === 0) {
        tickHeight = beamHeight * 0.24;
      } else if (index % 2 === 0) {
        tickHeight = beamHeight * 0.2;
      }
    } else {
      if (index % 40 === 0) {
        tickHeight = beamHeight * 0.36;
        label = String(index / 40);
      } else if (index % 4 === 0) {
        tickHeight = index % 20 === 0 ? beamHeight * 0.29 : beamHeight * 0.21;
      }
    }

    context.beginPath();
    context.moveTo(x, scaleBaseY);
    context.lineTo(x, scaleBaseY + tickHeight);
    context.stroke();

    if (label !== null) {
      context.font = `600 ${Math.max(11, Math.min(20, width / 68))}px Arial, sans-serif`;
      context.textAlign = "center";
      context.fillText(label, x, mainLabelY);
    }
  }

  context.font = `700 ${Math.max(9, Math.min(12, width / 96))}px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillStyle = accent;
  context.fillText(isMetric ? "mm" : "in", mainZeroX + 5, beamY + beamHeight * 0.95);

  // Upper slider plate and direct vernier. A vernier step is one resolution
  // shorter than a main-scale division, so the aligned mark remains physical.
  const resolutionInMm = scale.stepTicks / CALIPER_TICKS_PER_MM;
  const vernierStepInMm = mainDivisionInMm - resolutionInMm;
  const vernierStepPx = Math.max(2.15, vernierStepInMm * pixelsPerMm);
  context.fillStyle = metalLight;
  context.fillRect(upperPlateLeft, sliderTop, sliderRight - upperPlateLeft, upperPlateBottom - sliderTop);
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  context.strokeRect(upperPlateLeft, sliderTop, sliderRight - upperPlateLeft, upperPlateBottom - sliderTop);
  context.fillStyle = "#d7d7d4";
  context.fillRect(upperPlateLeft + 2, sliderTop + 3, Math.max(0, sliderRight - upperPlateLeft - 4), 5);

  // The vernier is a second, lower plate. The exposed band between both
  // plates preserves the complete main scale, as on the physical instrument.
  context.fillStyle = metalLight;
  context.fillRect(upperPlateLeft, vernierTop, sliderRight - upperPlateLeft, vernierBottom - vernierTop);
  context.strokeStyle = ink;
  context.strokeRect(upperPlateLeft, vernierTop, sliderRight - upperPlateLeft, vernierBottom - vernierTop);
  context.fillStyle = metalMid;
  context.fillRect(upperPlateLeft + 2, vernierBottom - 6, Math.max(0, sliderRight - upperPlateLeft - 4), 4);

  const baseLabelEvery =
    scale.vernierDivisions <= 10
      ? 1
      : scale.vernierDivisions === 20
        ? 2
        : 5;
  const minimumLabelStep = Math.max(baseLabelEvery, Math.ceil(12 / vernierStepPx));
  const labelEvery = Array.from(
    { length: scale.vernierDivisions / baseLabelEvery },
    (_, index) => (index + 1) * baseLabelEvery,
  ).find(
    (candidate) =>
      candidate >= minimumLabelStep && scale.vernierDivisions % candidate === 0,
  ) ?? scale.vernierDivisions;
  context.textAlign = "center";
  context.fillStyle = ink;
  context.font = `600 ${Math.max(8, Math.min(11, width / 100))}px Arial, sans-serif`;
  const vernierTickTop = vernierTop + 1;

  for (let index = 0; index <= scale.vernierDivisions; index += 1) {
    const x = movingScaleZeroX + index * vernierStepPx;
    if (x > sliderRight - 5) break;
    const major = index === 0 || index === scale.vernierDivisions || index % labelEvery === 0;
    const tickHeight = major ? beamHeight * 0.28 : beamHeight * 0.18;
    context.beginPath();
    context.moveTo(x, vernierTickTop);
    context.lineTo(x, vernierTickTop + tickHeight);
    context.stroke();
    if (major && !(scale.vernierDivisions === 50 && index === 50)) {
      const labelValue =
        scale.vernierDivisions === 20
          ? index / 2
          : scale.vernierDivisions === 50
            ? index / 5
            : index;
      context.fillText(String(labelValue), x, vernierBottom - 6);
    }
  }

  // Lock screw with a short neck and a cylindrical head.
  const screwX = movingScaleZeroX + Math.min(
    168,
    Math.max(68, (sliderRight - movingScaleZeroX) * 0.52),
  );
  const screwTop = sliderTop - 27;
  context.fillStyle = metalDark;
  context.fillRect(screwX - 7, screwTop + 8, 14, 19);
  context.strokeStyle = ink;
  context.strokeRect(screwX - 7, screwTop + 8, 14, 19);
  const screwGradient = context.createLinearGradient(screwX - 15, 0, screwX + 15, 0);
  screwGradient.addColorStop(0, metalDark);
  screwGradient.addColorStop(0.45, metalLight);
  screwGradient.addColorStop(1, metalDark);
  context.fillStyle = screwGradient;
  context.fillRect(screwX - 16, screwTop, 32, 10);
  context.strokeRect(screwX - 16, screwTop, 32, 10);

  // Thumb roller.
  const rollerX = Math.min(
    beamEnd - 32,
    movingContactX + Math.max(82, (sliderRight - movingContactX) * 0.86),
  );
  context.beginPath();
  context.arc(
    rollerX,
    vernierBottom + 3,
    Math.min(36, Math.max(22, beamHeight * 0.36)),
    0,
    Math.PI,
    false,
  );
  context.fillStyle = metalMid;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();

  // Compact maker's mark in the same neutral zone used by real instruments.
  const markSize = Math.min(22, beamHeight * 0.27);
  const markX = side + 11;
  const markY = beamY + beamHeight * 0.34;
  context.fillStyle = accent;
  context.beginPath();
  context.roundRect(markX, markY, markSize, markSize, Math.max(3, markSize * 0.22));
  context.fill();
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.font = `800 ${Math.max(6, markSize * 0.38)}px Arial, sans-serif`;
  context.fillText("CA", markX + markSize / 2, markY + markSize * 0.66);
  context.textAlign = "left";
  context.fillStyle = fineInk;
  context.font = `700 ${Math.max(7, Math.min(10, width / 120))}px Arial, sans-serif`;
  context.fillText("Cabalero", markX + markSize + 6, markY + markSize * 0.43);
  context.font = `500 ${Math.max(6, Math.min(8, width / 150))}px Arial, sans-serif`;
  context.fillText("Automações", markX + markSize + 6, markY + markSize * 0.86);

  // Contact arrows make the measured span explicit without revealing the value.
  const dimensionY = Math.min(height - 14, jawBottom + 27);
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(fixedContactX, jawBottom - 3);
  context.lineTo(fixedContactX, dimensionY + 2);
  context.moveTo(movingContactX, jawBottom - 3);
  context.lineTo(movingContactX, dimensionY + 2);
  context.stroke();
  context.beginPath();
  context.moveTo(fixedContactX, dimensionY);
  context.lineTo(movingContactX, dimensionY);
  context.stroke();
  context.beginPath();
  context.moveTo(fixedContactX, dimensionY);
  context.lineTo(fixedContactX + 11, dimensionY - 5);
  context.lineTo(fixedContactX + 11, dimensionY + 5);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(movingContactX, dimensionY);
  context.lineTo(movingContactX - 11, dimensionY - 5);
  context.lineTo(movingContactX - 11, dimensionY + 5);
  context.closePath();
  context.fill();
  context.restore();
}

function formatBreakdown(ticks: number, scale: CaliperScale): string {
  const mainDivisionTicks =
    scale.unit === "mm"
      ? Math.round(fractionToNumber(scale.mainScaleDivision) * CALIPER_TICKS_PER_MM)
      : Math.round(
          fractionToNumber(scale.mainScaleDivision) * 25.4 * CALIPER_TICKS_PER_MM,
        );
  const mainTicks = Math.floor(ticks / mainDivisionTicks) * mainDivisionTicks;
  const vernierTicks = ticks - mainTicks;

  if (scale.unit === "mm") {
    return `${formatCaliperReading(mainTicks, scale, { quantize: false })} + ${formatCaliperReading(vernierTicks, scale, { quantize: false })}`;
  }

  if (scale.format === "fraction") {
    return `${formatFractionalInches(mainTicks)} + ${formatFractionalInches(vernierTicks)}`;
  }

  return `${formatCaliperReading(mainTicks, scale, { quantize: false })} + ${formatCaliperReading(vernierTicks, scale, { quantize: false })}`;
}

export function CaliperWorkbench() {
  const [scaleId, setScaleId] = useState<CaliperScaleId>("mm-0.05");
  const [ticks, setTicks] = useState(() =>
    snapCaliperTicks(INITIAL_TICKS, "mm-0.05"),
  );
  const [answerVisible, setAnswerVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [detailMode, setDetailMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labRef = useRef<HTMLElement>(null);
  const dragOriginRef = useRef<{ clientX: number; ticks: number } | null>(null);
  const scale = CALIPER_SCALES[scaleId];
  const unit = scale.unit;
  const scalesForUnit = useMemo(() => getCaliperScalesForUnit(unit), [unit]);
  const reading = formatCaliperReading(ticks, scale);
  const breakdown = formatBreakdown(ticks, scale);

  const setReading = useCallback(
    (candidateTicks: number) => {
      setTicks(snapCaliperTicks(candidateTicks, scale));
    },
    [scale],
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === labRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      drawInstrument(
        context,
        rect.width,
        rect.height,
        ticks,
        scale,
        dragging,
        detailMode,
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
  }, [ticks, scale, dragging, detailMode]);

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const origin = dragOriginRef.current;
    if (!canvas || !origin) return;
    const rect = canvas.getBoundingClientRect();
    const { pixelsPerMm } = getGeometry(rect.width);
    const zoom = detailMode ? 1.55 : 1;
    const deltaMillimetres =
      (event.clientX - origin.clientX) / (pixelsPerMm * zoom);
    setReading(origin.ticks + mmToTicks(deltaMillimetres));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { clientX: event.clientX, ticks };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event);
  };

  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOriginRef.current = null;
    setDragging(false);
  };

  const changeUnit = (nextUnit: MeasurementUnit) => {
    const nextScaleId: CaliperScaleId =
      nextUnit === "mm" ? "mm-0.05" : "in-1/128";
    setScaleId(nextScaleId);
    setTicks((current) => snapCaliperTicks(current, nextScaleId));
    setAnnouncement(
      nextUnit === "mm" ? "Unidade alterada para milímetros." : "Unidade alterada para polegadas.",
    );
  };

  const changeScale = (nextScaleId: CaliperScaleId) => {
    setScaleId(nextScaleId);
    setTicks((current) => snapCaliperTicks(current, nextScaleId));
    setAnnouncement(`Resolução alterada para ${CALIPER_SCALES[nextScaleId].label}.`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    let nextTicks = ticks;
    const largeStep = scale.stepTicks * 10;
    const arrowStep = event.shiftKey ? largeStep : scale.stepTicks;

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
        nextTicks -= largeStep;
        break;
      case "PageUp":
        nextTicks += largeStep;
        break;
      case "Home":
        nextTicks = 0;
        break;
      case "End":
        nextTicks = DEFAULT_CALIPER_MAX_TICKS;
        break;
      default:
        return;
    }

    event.preventDefault();
    setReading(nextTicks);
  };

  const randomize = () => {
    const totalSteps = Math.floor(DEFAULT_CALIPER_MAX_TICKS / scale.stepTicks);
    const next = Math.floor(Math.random() * (totalSteps + 1)) * scale.stepTicks;
    setTicks(next);
    setAnswerVisible(false);
    setAnnouncement("Nova medida sorteada. A resposta está oculta.");
    canvasRef.current?.focus();
  };

  const toggleAnswer = () => {
    setAnswerVisible((visible) => {
      setAnnouncement(visible ? "Resposta ocultada." : `Resposta exibida: ${reading}.`);
      return !visible;
    });
  };

  const toggleFullscreen = async () => {
    if (!labRef.current || !document.fullscreenEnabled) {
      setAnnouncement("A tela cheia não está disponível neste navegador.");
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await labRef.current.requestFullscreen();
      }
    } catch {
      setAnnouncement("Não foi possível alternar a tela cheia.");
    }
  };

  const ariaValue = unit === "mm" ? ticksToMm(ticks) : ticksToInches(ticks);
  const ariaMax =
    unit === "mm"
      ? ticksToMm(DEFAULT_CALIPER_MAX_TICKS)
      : ticksToInches(DEFAULT_CALIPER_MAX_TICKS);

  return (
    <main className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a className="brand" href="#simulador" aria-label="Cabalero Automações — início">
          <span className="brand-mark" aria-hidden="true">
            <span>CA</span>
          </span>
          <span className="brand-copy">
            <strong>Cabalero_Automações</strong>
            <small>Engenharia de Software aplicada à Indústria</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="status-chip">
            <span aria-hidden="true" /> Paquímetro universal
          </span>
          <button
            className="icon-text-button detail-button"
            type="button"
            aria-pressed={detailMode}
            onClick={() => setDetailMode((active) => !active)}
          >
            <span aria-hidden="true">⌕</span>
            {detailMode ? "Visão geral" : "Ampliar escala"}
          </button>
          <button className="icon-text-button" type="button" onClick={toggleFullscreen}>
            <span aria-hidden="true">⛶</span>
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
        </div>
      </header>

      <section className="workbench" id="simulador" aria-labelledby="instrument-title">
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="instrument-title">Paquímetro universal com nônio</h1>
          </div>
          <div className="stage-aside">
            <p className="interaction-hint">
              <span aria-hidden="true">↔</span>
              Arraste o cursor ou use as setas do teclado
            </p>
            <div className="readout" data-hidden={!answerVisible}>
              <div className="readout-label">
                <span>Medida atual</span>
                <button
                  className="eye-button"
                  type="button"
                  aria-label={answerVisible ? "Ocultar medida" : "Exibir medida"}
                  aria-pressed={!answerVisible}
                  title={answerVisible ? "Ocultar medida" : "Exibir medida"}
                  onClick={toggleAnswer}
                >
                  <span className={`eye-symbol${answerVisible ? "" : " is-closed"}`} aria-hidden="true" />
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

        <div className="instrument-stage">
          <canvas
            ref={canvasRef}
            className={`caliper-canvas${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label={`Abrir ou fechar o paquímetro. Resolução ${scale.label}.${detailMode ? " Escala ampliada." : ""}`}
            aria-valuemin={0}
            aria-valuemax={ariaMax}
            aria-valuenow={ariaValue}
            aria-valuetext={answerVisible ? reading : "Resposta oculta"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onKeyDown={onKeyDown}
          >
            Simulador de paquímetro universal. Use os controles para definir a medida.
          </canvas>

          <div className="stage-legend" aria-hidden="true">
            <span><i className="legend-fixed" /> escala principal</span>
            <span><i className="legend-moving" /> cursor e nônio</span>
          </div>
        </div>

        <div className="control-deck" aria-label="Controles do instrumento">
          <fieldset className="control-group unit-control">
            <legend>Unidade</legend>
            <div className="segmented-control">
              <button
                type="button"
                data-active={unit === "mm"}
                aria-pressed={unit === "mm"}
                onClick={() => changeUnit("mm")}
              >
                Milímetro <span>mm</span>
              </button>
              <button
                type="button"
                data-active={unit === "in"}
                aria-pressed={unit === "in"}
                onClick={() => changeUnit("in")}
              >
                Polegada <span>in</span>
              </button>
            </div>
          </fieldset>

          <fieldset className="control-group resolution-control">
            <legend>Resolução do nônio</legend>
            <div className="resolution-options">
              {scalesForUnit.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-active={scaleId === option.id}
                  aria-pressed={scaleId === option.id}
                  onClick={() => changeScale(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{SCALE_NOTES[option.id]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="practice-actions">
            <button className="secondary-button" type="button" onClick={() => setReading(0)}>
              <span aria-hidden="true">↺</span> Fechar
            </button>
            <button className="primary-button" type="button" onClick={randomize}>
              <span aria-hidden="true">⚄</span> Sortear e ocultar
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    </main>
  );
}

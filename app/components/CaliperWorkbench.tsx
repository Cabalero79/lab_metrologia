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
  mainZeroX: number;
  pixelsPerMm: number;
}

function getGeometry(width: number): Geometry {
  const side = Math.min(72, Math.max(18, width * 0.045));
  const fixedJawWidth = Math.min(154, Math.max(72, width * 0.12));
  const endReserve = Math.min(176, Math.max(68, width * 0.13));
  const mainZeroX = side + fixedJawWidth;
  const usableWidth = Math.max(180, width - mainZeroX - side - endReserve);

  return {
    mainZeroX,
    pixelsPerMm: usableWidth / 150,
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
  const { mainZeroX, pixelsPerMm } = getGeometry(width);
  const valueMm = ticksToMm(ticks);
  const jawX = mainZeroX + valueMm * pixelsPerMm;
  const side = Math.min(72, Math.max(18, width * 0.045));
  const beamY = Math.max(176, height * 0.38);
  const beamHeight = Math.min(104, Math.max(74, height * 0.18));
  const beamEnd = width - side;
  const jawBottom = Math.min(height - 36, beamY + beamHeight + height * 0.31);
  const metal = "#c9c8c5";
  const metalLight = "#efefed";
  const metalDark = "#777575";
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
    context.translate(-jawX, -detailY);
  }
  context.lineJoin = "round";
  context.lineCap = "square";

  // Depth rod behind the beam.
  context.fillStyle = metalLight;
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  context.fillRect(jawX + 50, beamY + 18, Math.max(0, beamEnd - jawX - 22), 13);
  context.strokeRect(jawX + 50, beamY + 18, Math.max(0, beamEnd - jawX - 22), 13);

  // Main beam.
  context.fillStyle = metal;
  context.fillRect(side, beamY, beamEnd - side, beamHeight);
  context.strokeStyle = ink;
  context.lineWidth = 2;
  context.strokeRect(side, beamY, beamEnd - side, beamHeight);
  context.fillStyle = "#a9a8a5";
  context.fillRect(side + 2, beamY + 3, beamEnd - side - 4, 7);

  // Fixed lower jaw.
  context.beginPath();
  context.moveTo(side, beamY + beamHeight - 5);
  context.lineTo(mainZeroX, beamY + beamHeight - 5);
  context.lineTo(mainZeroX, jawBottom - 70);
  context.quadraticCurveTo(mainZeroX - 5, jawBottom - 18, mainZeroX - 35, jawBottom);
  context.lineTo(side + 38, jawBottom);
  context.quadraticCurveTo(side + 18, jawBottom - 5, side + 12, jawBottom - 38);
  context.lineTo(side, beamY + beamHeight - 5);
  context.closePath();
  context.fillStyle = metal;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(mainZeroX - 8, beamY + beamHeight + 1, 8, Math.max(20, jawBottom - beamY - beamHeight - 73));

  // Fixed internal jaw.
  context.beginPath();
  context.moveTo(side, beamY + 1);
  context.lineTo(side, beamY - 68);
  context.lineTo(side + 12, beamY - 68);
  context.lineTo(side + 12, beamY - 127);
  context.quadraticCurveTo(side + 48, beamY - 108, side + 50, beamY - 52);
  context.lineTo(side + 50, beamY + 1);
  context.closePath();
  context.fillStyle = metal;
  context.fill();
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(side + 42, beamY - 66, 8, 67);

  // Moving lower jaw and slider body.
  context.beginPath();
  context.moveTo(jawX, beamY + beamHeight - 7);
  context.lineTo(jawX + Math.min(128, width * 0.11), beamY + beamHeight - 7);
  context.lineTo(jawX + Math.min(88, width * 0.075), jawBottom - 28);
  context.quadraticCurveTo(jawX + 76, jawBottom, jawX + 46, jawBottom);
  context.lineTo(jawX, jawBottom);
  context.closePath();
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(jawX, beamY + beamHeight + 1, 8, Math.max(20, jawBottom - beamY - beamHeight - 4));

  // Moving internal jaw.
  context.beginPath();
  context.moveTo(jawX, beamY + 1);
  context.lineTo(jawX, beamY - 58);
  context.quadraticCurveTo(jawX + 3, beamY - 105, jawX + 42, beamY - 126);
  context.lineTo(jawX + 42, beamY - 54);
  context.lineTo(jawX + 78, beamY - 54);
  context.lineTo(jawX + 78, beamY + 1);
  context.closePath();
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill();
  context.stroke();
  context.fillStyle = metalDark;
  context.fillRect(jawX, beamY - 57, 8, 58);

  // Slider bridge and lock screw.
  const sliderRight = Math.min(beamEnd - 8, jawX + Math.min(270, width * 0.24));
  context.fillStyle = metalLight;
  context.fillRect(jawX, beamY - 48, sliderRight - jawX, beamHeight + 40);
  context.strokeStyle = ink;
  context.strokeRect(jawX, beamY - 48, sliderRight - jawX, beamHeight + 40);
  const screwX = jawX + Math.min(118, Math.max(52, (sliderRight - jawX) * 0.56));
  context.fillStyle = metalDark;
  context.fillRect(screwX - 10, beamY - 67, 20, 18);
  context.strokeRect(screwX - 10, beamY - 67, 20, 18);
  context.fillStyle = ink;
  context.fillRect(screwX - 14, beamY - 72, 28, 7);

  // Main scale.
  const isMetric = scale.unit === "mm";
  const mainDivisionInMm = isMetric
    ? fractionToNumber(scale.mainScaleDivision)
    : fractionToNumber(scale.mainScaleDivision) * 25.4;
  const mainTickCount = Math.floor(150 / mainDivisionInMm);
  const scaleBaseY = beamY + beamHeight * 0.64;
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
        tickHeight = 35;
        label = String(Math.round(millimetres / 10));
      } else if (Math.abs(millimetres % 5) < 0.0001) {
        tickHeight = 25;
      }
    } else if (scale.id === "in-1/128") {
      if (index % 16 === 0) {
        tickHeight = 35;
        label = String(index / 16);
      } else if (index % 8 === 0) {
        tickHeight = 27;
      } else if (index % 4 === 0) {
        tickHeight = 22;
      } else if (index % 2 === 0) {
        tickHeight = 18;
      }
    } else {
      if (index % 40 === 0) {
        tickHeight = 35;
        label = String(index / 40);
      } else if (index % 4 === 0) {
        tickHeight = index % 20 === 0 ? 27 : 19;
      }
    }

    context.beginPath();
    context.moveTo(x, scaleBaseY);
    context.lineTo(x, scaleBaseY + tickHeight);
    context.stroke();

    if (label !== null) {
      context.font = `600 ${Math.max(10, Math.min(16, width / 78))}px Arial, sans-serif`;
      context.textAlign = "center";
      context.fillText(label, x, scaleBaseY - 7);
    }
  }

  context.font = `700 ${Math.max(9, Math.min(12, width / 96))}px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillStyle = accent;
  context.fillText(isMetric ? "mm" : "in", mainZeroX + 5, beamY + 24);

  // Vernier scale. A direct vernier step is one resolution shorter than a
  // division of the main scale, which makes the aligned mark physically true.
  const resolutionInMm = scale.stepTicks / CALIPER_TICKS_PER_MM;
  const vernierStepInMm = mainDivisionInMm - resolutionInMm;
  const vernierStepPx = Math.max(2.15, vernierStepInMm * pixelsPerMm);
  const maxVernierWidth = Math.max(62, beamEnd - jawX - 8);
  const naturalVernierWidth = vernierStepPx * scale.vernierDivisions + 22;
  const vernierWidth = Math.min(maxVernierWidth, naturalVernierWidth);
  const vernierY = beamY + beamHeight - 4;
  const vernierHeight = Math.min(68, Math.max(54, height * 0.105));

  context.fillStyle = metalLight;
  context.fillRect(jawX, vernierY, vernierWidth, vernierHeight);
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  context.strokeRect(jawX, vernierY, vernierWidth, vernierHeight);

  const labelEvery = scale.vernierDivisions <= 10 ? 1 : scale.vernierDivisions <= 25 ? 5 : 10;
  context.textAlign = "center";
  context.fillStyle = ink;
  context.font = `600 ${Math.max(8, Math.min(11, width / 100))}px Arial, sans-serif`;

  for (let index = 0; index <= scale.vernierDivisions; index += 1) {
    const x = jawX + index * vernierStepPx;
    if (x > jawX + vernierWidth - 4) break;
    const major = index === 0 || index === scale.vernierDivisions || index % labelEvery === 0;
    const tickHeight = major ? 25 : 15;
    context.beginPath();
    context.moveTo(x, vernierY + 1);
    context.lineTo(x, vernierY + 1 + tickHeight);
    context.stroke();
    if (major) {
      const labelValue = scale.vernierDivisions === 20 ? index / 2 : index;
      context.fillText(String(labelValue), x, vernierY + 42);
    }
  }

  // Thumb roller.
  const rollerX = Math.min(beamEnd - 32, jawX + Math.max(62, vernierWidth * 0.78));
  context.beginPath();
  context.arc(rollerX, vernierY + vernierHeight + 9, 27, 0, Math.PI, false);
  context.fillStyle = "#aaa8a7";
  context.fill();
  context.strokeStyle = ink;
  context.stroke();

  // Instrument branding.
  context.textAlign = "left";
  context.fillStyle = fineInk;
  context.font = `700 ${Math.max(8, Math.min(12, width / 90))}px Arial, sans-serif`;
  context.fillText("Cabalero_Automações", side + 16, beamY + 31);

  // Contact arrows make the measured span explicit without revealing the value.
  const dimensionY = Math.min(height - 13, jawBottom + 24);
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(mainZeroX, dimensionY);
  context.lineTo(jawX, dimensionY);
  context.stroke();
  context.beginPath();
  context.moveTo(mainZeroX, dimensionY);
  context.lineTo(mainZeroX + 10, dimensionY - 5);
  context.lineTo(mainZeroX + 10, dimensionY + 5);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(jawX, dimensionY);
  context.lineTo(jawX - 10, dimensionY - 5);
  context.lineTo(jawX - 10, dimensionY + 5);
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
    if (!canvas) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
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
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
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
          <p className="interaction-hint">
            <span aria-hidden="true">↔</span>
            Arraste o cursor ou use as setas do teclado
          </p>
        </div>

        <div className="instrument-stage">
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

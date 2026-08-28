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
  formatOppositeUnitReading,
  getCaliperScalesForUnit,
  mmToTicks,
  snapCaliperTicks,
  ticksToInches,
  ticksToMm,
} from "../../lib/caliper";
import {
  getCaliperDetailZoom,
  getScalePresentation,
  getVernierLabelInterval,
} from "../../lib/caliper-presentation";
import {
  getCaliperGeometry,
  type CaliperGeometry,
} from "../../lib/caliper-geometry";
import { InstrumentSelector } from "./InstrumentSelector";
import type { InstrumentNavigationProps } from "./instrument-types";

const INITIAL_TICKS = mmToTicks(58.35);

export interface CaliperSessionState {
  readonly scaleId: CaliperScaleId;
  readonly ticks: number;
  readonly answerVisible: boolean;
  readonly mainScaleNumbersVisible: boolean;
}

interface CaliperWorkbenchProps extends InstrumentNavigationProps {
  readonly initialSession?: CaliperSessionState;
  readonly onSessionChange?: (session: CaliperSessionState) => void;
}

const SCALE_NOTES: Record<CaliperScaleId, string> = {
  "mm-0.1": "nônio decimal · 10 divisões",
  "mm-0.05": "cinco centésimos · 20 divisões",
  "mm-0.02": "dois centésimos · 50 divisões",
  "in-1/128": "polegada fracionária · 8 divisões",
  "in-0.001": "polegada milesimal · 25 divisões",
};

type InstrumentLayout = CaliperGeometry;

function getInstrumentLayout(
  width: number,
  height: number,
  ticks: number,
  scale: CaliperScale,
): InstrumentLayout {
  return getCaliperGeometry(width, height, ticksToMm(ticks), scale);
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
  layout: InstrumentLayout,
  scale: CaliperScale,
): DetailViewport {
  const mainDivisionInMm =
    scale.unit === "mm"
      ? fractionToNumber(scale.mainScaleDivision)
      : fractionToNumber(scale.mainScaleDivision) * 25.4;
  const mainDivisionPx = mainDivisionInMm * layout.pixelsPerMm;
  const vernierEndX =
    layout.movingScaleZeroX + scale.vernierDivisions * layout.vernierStepPx;
  const sourceLeft = layout.movingScaleZeroX - mainDivisionPx * 1.5;
  const sourceRight = vernierEndX + Math.max(18, mainDivisionPx);
  const sourceWidth = Math.max(1, sourceRight - sourceLeft);
  const horizontalZoom = (width * 0.82) / sourceWidth;
  const zoom = getCaliperDetailZoom(
    width,
    layout.vernierStepPx,
    horizontalZoom,
  );
  const presentation = getScalePresentation(scale.unit, layout);

  return {
    zoom,
    focusX: (sourceLeft + sourceRight) / 2,
    focusY: presentation.detailFocusY,
    targetX: width * 0.5,
    targetY: height * 0.5,
  };
}

function getExternalJawPath(
  layout: InstrumentLayout,
  contactX: number,
  direction: -1 | 1,
): Path2D {
  const path = new Path2D();
  const shoulderX = contactX + direction * layout.externalJawSpan;
  const relievedShoulderX =
    contactX + direction * (layout.externalJawSpan - layout.B * 0.06);
  const heelX = contactX + direction * layout.heelSpan;

  path.moveTo(contactX, layout.contactTopY);
  path.lineTo(shoulderX, layout.contactTopY);
  path.lineTo(
    shoulderX,
    layout.contactTopY + layout.beamHeight * 0.23,
  );
  path.lineTo(
    relievedShoulderX,
    layout.contactTopY + layout.beamHeight * 0.27,
  );
  path.lineTo(heelX, layout.jawBottom - layout.B * 0.18);
  path.quadraticCurveTo(
    heelX - direction * layout.B * 0.03,
    layout.jawBottom - layout.B * 0.035,
    contactX + direction * layout.B * 0.12,
    layout.jawBottom,
  );
  path.lineTo(contactX, layout.jawBottom);
  path.closePath();
  return path;
}

function getMovingExternalJawPath(layout: InstrumentLayout): Path2D {
  return getExternalJawPath(layout, layout.movingContactX, 1);
}

function getMovingInternalJawPath(layout: InstrumentLayout): Path2D {
  const path = new Path2D();
  path.moveTo(layout.movingInternalRootX, layout.beamY + 1);
  path.lineTo(layout.movingInternalRootX, layout.internalShelfY);
  path.quadraticCurveTo(
    layout.movingInternalRootX,
    layout.upperTipY + layout.beamHeight * 0.58,
    layout.movingInternalFaceX,
    layout.upperTipY,
  );
  path.lineTo(layout.movingInternalFaceX, layout.internalShelfY);
  path.lineTo(layout.movingScaleZeroX, layout.internalShelfY);
  path.lineTo(layout.movingScaleZeroX, layout.beamY + 1);
  path.closePath();
  return path;
}

function isPointInMovingAssembly(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  ticks: number,
  scale: CaliperScale,
  detailMode: boolean,
  detailAnchorTicks: number | null,
): boolean {
  const layout = getInstrumentLayout(rect.width, rect.height, ticks, scale);
  let x = clientX - rect.left;
  let y = clientY - rect.top;

  if (detailMode) {
    const viewportLayout = getInstrumentLayout(
      rect.width,
      rect.height,
      detailAnchorTicks ?? ticks,
      scale,
    );
    const viewport = getDetailViewport(rect.width, rect.height, viewportLayout, scale);
    x = (x - viewport.targetX) / viewport.zoom + viewport.focusX;
    y = (y - viewport.targetY) / viewport.zoom + viewport.focusY;
  }

  const within = (
    left: number,
    top: number,
    right: number,
    bottom: number,
    padding = 0,
  ) =>
    x >= left - padding &&
    x <= right + padding &&
    y >= top - padding &&
    y <= bottom + padding;

  const hitContext = document.createElement("canvas").getContext("2d");
  const onExternalJaw =
    hitContext?.isPointInPath(getMovingExternalJawPath(layout), x, y) ?? false;
  const onInternalJaw =
    hitContext?.isPointInPath(getMovingInternalJawPath(layout), x, y) ?? false;
  const onUpperPlate = within(
    layout.upperPlateLeft,
    layout.sliderTop,
    layout.sliderRight,
    layout.upperPlateBottom,
    5,
  );
  const onVernier = within(
    layout.upperPlateLeft,
    layout.vernierTop,
    layout.sliderRight,
    layout.vernierBottom,
    5,
  );
  const onScrewHead = within(
    layout.screwX - layout.B * 0.25,
    layout.screwTop,
    layout.screwX + layout.B * 0.25,
    layout.screwTop + layout.B * 0.08,
    2,
  );
  const onScrewStem = within(
    layout.screwX - layout.B * 0.055,
    layout.screwTop + layout.B * 0.065,
    layout.screwX + layout.B * 0.055,
    layout.sliderTop,
    2,
  );
  const rollerDx = x - layout.rollerX;
  const rollerDy = y - (layout.vernierBottom + 3);
  const onRoller =
    rollerDy >= -5 &&
    rollerDy <= layout.rollerRadius + 7 &&
    rollerDx * rollerDx + rollerDy * rollerDy <=
      (layout.rollerRadius + 7) ** 2;

  return (
    onExternalJaw ||
    onInternalJaw ||
    onUpperPlate ||
    onVernier ||
    onScrewHead ||
    onScrewStem ||
    onRoller
  );
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
  detailAnchorTicks: number | null,
  readingLabel: string,
  answerVisible: boolean,
  mainScaleNumbersVisible: boolean,
  brandingImage: HTMLImageElement | null,
) {
  const layout = getInstrumentLayout(width, height, ticks, scale);
  const {
    B,
    side,
    fixedContactX,
    mainZeroX,
    pixelsPerMm,
    beamEnd,
    beamY,
    beamHeight,
    beamBottom,
    jawBottom,
    contactTopY,
    upperTipY,
    movingScaleZeroX,
    movingContactX,
    fixedInternalFaceX,
    movingInternalFaceX,
    internalShelfY,
    sliderTop,
    sliderRight,
    upperPlateLeft,
    upperPlateBottom,
    vernierTop,
    vernierBottom,
    vernierStepPx,
    screwX,
    screwTop,
    rollerX,
    rollerRadius,
    travelPx,
    fixedStepDatumX,
    movingStepDatumX,
    dimensionY,
  } = layout;
  const metal = "#c8c8c6";
  const metalLight = "#eeeeec";
  const metalMid = "#aaa9a7";
  const metalDark = "#6f6e6d";
  const ink = "#181619";
  const fineInk = "#3c383b";
  const accent = "#7c2145";

  context.clearRect(0, 0, width, height);
  const viewportLayout = detailMode
    ? getInstrumentLayout(width, height, detailAnchorTicks ?? ticks, scale)
    : null;
  const detailViewport = viewportLayout
    ? getDetailViewport(width, height, viewportLayout, scale)
    : null;
  const projectionScale = detailViewport?.zoom ?? 1;
  context.save();
  if (detailViewport) {
    context.translate(detailViewport.targetX, detailViewport.targetY);
    context.scale(detailViewport.zoom, detailViewport.zoom);
    context.translate(-detailViewport.focusX, -detailViewport.focusY);
  }
  context.lineJoin = "round";
  context.lineCap = "square";

  // Depth rod behind the beam.
  context.fillStyle = metalLight;
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  const depthRodHeight = B * 0.075;
  context.fillRect(beamEnd, beamY + B * 0.22, travelPx, depthRodHeight);
  context.strokeRect(beamEnd, beamY + B * 0.22, travelPx, depthRodHeight);

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

  // Dedicated step-measurement datums. They share one datum offset and their
  // separation is exactly the quantized cursor travel.
  context.strokeStyle = accent;
  context.lineWidth = Math.max(1, B * 0.018);
  context.beginPath();
  context.moveTo(fixedStepDatumX, beamY + B * 0.04);
  context.lineTo(fixedStepDatumX, beamY + B * 0.2);
  context.moveTo(movingStepDatumX, beamY + B * 0.04);
  context.lineTo(movingStepDatumX, beamY + B * 0.2);
  context.stroke();

  // Both external jaws share one mirrored technical profile. The fixed frame
  // keeps a short bridge to the beam, while the measuring legs themselves are
  // geometrically identical around their contact faces.
  context.fillStyle = metal;
  context.fillRect(
    side,
    beamBottom - 7,
    fixedContactX - side,
    contactTopY - beamBottom + 7,
  );
  context.strokeStyle = ink;
  context.strokeRect(
    side,
    beamBottom - 7,
    fixedContactX - side,
    contactTopY - beamBottom + 7,
  );
  const fixedExternalJawPath = getExternalJawPath(layout, fixedContactX, -1);
  context.fillStyle = metal;
  context.fill(fixedExternalJawPath);
  context.stroke(fixedExternalJawPath);
  const externalPadWidth = B * 0.337;
  const externalPadHeight = B * 0.628;
  context.fillStyle = metalDark;
  context.save();
  context.clip(fixedExternalJawPath);
  context.fillRect(
    fixedContactX - externalPadWidth,
    jawBottom - externalPadHeight,
    externalPadWidth,
    externalPadHeight,
  );
  context.restore();

  // Fixed internal jaw.
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
  const internalPadWidth = B * 0.055;
  const internalPadHeight = B * 0.18;
  context.fillStyle = metalDark;
  context.fillRect(
    fixedInternalFaceX - internalPadWidth,
    upperTipY,
    internalPadWidth,
    internalPadHeight,
  );

  // Moving external jaw. Its long shoulder and tapered leg follow the
  // proportions of a universal caliper while preserving the exact contact.
  const movingExternalJawPath = getMovingExternalJawPath(layout);
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill(movingExternalJawPath);
  context.strokeStyle = ink;
  context.stroke(movingExternalJawPath);
  context.fillStyle = metalDark;
  context.save();
  context.clip(movingExternalJawPath);
  context.fillRect(
    movingContactX,
    jawBottom - externalPadHeight,
    externalPadWidth,
    externalPadHeight,
  );
  context.restore();

  // Moving internal jaw.
  const movingInternalJawPath = getMovingInternalJawPath(layout);
  context.fillStyle = dragging ? "#b9b7b5" : metal;
  context.fill(movingInternalJawPath);
  context.stroke(movingInternalJawPath);
  context.fillStyle = metalDark;
  context.fillRect(
    movingInternalFaceX,
    upperTipY,
    internalPadWidth,
    internalPadHeight,
  );

  // The reference cursor is one rigid bridge: upper plate, lower vernier,
  // screw, roller and both moving jaws share the same translation.
  // Main scale.
  const isMetric = scale.unit === "mm";
  const mainDivisionInMm = isMetric
    ? fractionToNumber(scale.mainScaleDivision)
    : fractionToNumber(scale.mainScaleDivision) * 25.4;
  const mainTickCount = Math.floor(150 / mainDivisionInMm);
  const scalePresentation = getScalePresentation(scale.unit, layout);
  const scaleBaseY = scalePresentation.mainTickBaselineY;
  const mainLabelY = scalePresentation.mainLabelY;
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
    context.lineTo(
      x,
      scaleBaseY + tickHeight * scalePresentation.mainTickDirection,
    );
    context.stroke();

    if (label !== null && mainScaleNumbersVisible) {
      context.font = `600 ${Math.max(11, Math.min(20, width / 68))}px Arial, sans-serif`;
      context.textAlign = "center";
      context.fillText(label, x, mainLabelY);
    }
  }

  context.font = `700 ${Math.max(9, Math.min(12, width / 96))}px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillStyle = accent;
  context.fillText(
    isMetric ? "mm" : "in",
    mainZeroX + 5,
    scalePresentation.unitLabelY,
  );

  // Upper slider plate and direct vernier. A vernier step is one resolution
  // shorter than a main-scale division, so the aligned mark remains physical.
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

  const vernierPlateHeight = scale.unit === "in"
    ? upperPlateBottom - sliderTop
    : vernierBottom - vernierTop;
  const projectedPlateHeight = vernierPlateHeight * projectionScale;
  const vernierScreenFontSize = Math.max(
    detailMode ? 14 : projectedPlateHeight >= 14 ? 10 : 9,
    Math.min(detailMode ? 17 : 11, B * projectionScale * 0.12),
  );
  const vernierFontSize = vernierScreenFontSize / projectionScale;
  const renderVernierLabels = detailMode || projectedPlateHeight >= 14;
  const labelEvery = getVernierLabelInterval(
    scale.id,
    scale.vernierDivisions,
    vernierStepPx * projectionScale,
    vernierScreenFontSize * 1.35 + 4,
  );
  context.textAlign = "center";
  context.fillStyle = ink;
  context.font = `650 ${vernierFontSize}px Arial, sans-serif`;
  const vernierTickBaselineY = scalePresentation.vernierTickBaselineY;
  const labelGap = 2 / projectionScale;
  const labelAscent = vernierFontSize * 0.78;
  const availableMajorTickHeight = scalePresentation.vernierTickDirection > 0
    ? scalePresentation.vernierLabelY -
      labelAscent -
      vernierTickBaselineY -
      labelGap
    : vernierTickBaselineY -
      (scalePresentation.vernierLabelY + vernierFontSize * 0.22) -
      labelGap;
  const maximumMajorTickHeight = renderVernierLabels
    ? Math.max(2 / projectionScale, availableMajorTickHeight)
    : vernierPlateHeight * 0.72;

  for (let index = 0; index <= scale.vernierDivisions; index += 1) {
    const x = movingScaleZeroX + index * vernierStepPx;
    const major = index === 0 || index === scale.vernierDivisions || index % labelEvery === 0;
    const tickHeight = major
      ? Math.min(beamHeight * 0.28, maximumMajorTickHeight)
      : Math.min(beamHeight * 0.18, maximumMajorTickHeight * 0.66);
    context.strokeStyle = !renderVernierLabels && index === 0 ? accent : ink;
    context.lineWidth = !renderVernierLabels && index === 0 ? 1.8 : 1;
    context.beginPath();
    context.moveTo(x, vernierTickBaselineY);
    context.lineTo(
      x,
      vernierTickBaselineY + tickHeight * scalePresentation.vernierTickDirection,
    );
    context.stroke();
    if (major && renderVernierLabels) {
      const labelValue =
        scale.vernierDivisions === 20
          ? index / 2
          : scale.vernierDivisions === 50
            ? index / 5
            : index;
      context.fillText(String(labelValue), x, scalePresentation.vernierLabelY);
    }
  }
  context.strokeStyle = ink;

  // Lock screw with a short neck and a cylindrical head.
  context.fillStyle = metalDark;
  context.fillRect(
    screwX - B * 0.055,
    screwTop + B * 0.065,
    B * 0.11,
    sliderTop - (screwTop + B * 0.065),
  );
  context.strokeStyle = ink;
  context.strokeRect(
    screwX - B * 0.055,
    screwTop + B * 0.065,
    B * 0.11,
    sliderTop - (screwTop + B * 0.065),
  );
  const screwGradient = context.createLinearGradient(
    screwX - B * 0.25,
    0,
    screwX + B * 0.25,
    0,
  );
  screwGradient.addColorStop(0, metalDark);
  screwGradient.addColorStop(0.45, metalLight);
  screwGradient.addColorStop(1, metalDark);
  context.fillStyle = screwGradient;
  context.fillRect(screwX - B * 0.25, screwTop, B * 0.5, B * 0.08);
  context.strokeRect(screwX - B * 0.25, screwTop, B * 0.5, B * 0.08);

  // Thumb roller.
  context.beginPath();
  context.arc(
    rollerX,
    vernierBottom + 3,
    rollerRadius,
    0,
    Math.PI,
    false,
  );
  context.fillStyle = metalMid;
  context.fill();
  context.strokeStyle = ink;
  context.stroke();

  // Stack the maker's mark inside the neutral zone at every viewport size.
  // Keeping the copy below the figure guarantees clearance from scale zero.
  const brandZoneWidth = mainZeroX - side;
  const largeBrandZone = brandZoneWidth >= 130;
  const markSize = largeBrandZone
    ? Math.min(60, Math.max(52, beamHeight * 0.58))
    : Math.max(
        10,
        Math.min(44, beamHeight * 0.5, brandZoneWidth * 0.72),
      );
  const markX = side + (brandZoneWidth - markSize) / 2;
  const markY = beamY + 4;
  if (brandingImage) {
    context.drawImage(brandingImage, markX, markY, markSize, markSize);
  } else {
    context.fillStyle = accent;
    context.beginPath();
    context.roundRect(markX, markY, markSize, markSize, Math.max(3, markSize * 0.22));
    context.fill();
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = `800 ${Math.max(6, markSize * 0.38)}px Arial, sans-serif`;
    context.fillText("CA", markX + markSize / 2, markY + markSize * 0.66);
  }
  context.fillStyle = fineInk;
  const brandCenterX = side + brandZoneWidth / 2;
  const brandNameSize = largeBrandZone
    ? 13
    : Math.max(5, Math.min(10, markSize * 0.25));
  const brandDescriptorSize = largeBrandZone
    ? 11
    : Math.max(4.5, Math.min(9, markSize * 0.22));
  const brandTextWidth = Math.max(1, brandZoneWidth - 4);
  context.textAlign = "center";
  context.font = `750 ${brandNameSize}px Arial, sans-serif`;
  context.fillText(
    "Cabalero",
    brandCenterX,
    markY + markSize + brandNameSize,
    brandTextWidth,
  );
  context.font = `550 ${brandDescriptorSize}px Arial, sans-serif`;
  context.fillText(
    "Automações",
    brandCenterX,
    markY + markSize + brandNameSize + brandDescriptorSize + 2,
    brandTextWidth,
  );
  context.textAlign = "left";

  // Contact arrows and their label are tied to the same exact reading used by
  // the HTML readout. In practice mode the label becomes a neutral question
  // mark, so the physical opening remains visible without leaking the answer.
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

  const dimensionLabel = answerVisible
    ? readingLabel.replace(/\s+(?:mm|in)$/u, "")
    : "?";
  const dimensionFontSize = Math.max(20, Math.min(36, width / 42));
  context.font = `500 ${dimensionFontSize}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const labelWidth = context.measureText(dimensionLabel).width + 24;
  const openingWidth = Math.max(0, movingContactX - fixedContactX);
  let labelCenterX = (fixedContactX + movingContactX) / 2;
  if (labelWidth + 16 > openingWidth) {
    labelCenterX = Math.min(
      width - labelWidth / 2 - 8,
      movingContactX + labelWidth / 2 + 18,
    );
  }
  const labelCenterY = dimensionY - dimensionFontSize * 0.78;
  // A rounded text halo keeps the reading legible over metal without the
  // conspicuous white rectangle that crossed the lower jaw at small openings.
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(4, dimensionFontSize * 0.18);
  context.lineJoin = "round";
  context.strokeText(dimensionLabel, labelCenterX, labelCenterY);
  context.fillStyle = ink;
  context.fillText(dimensionLabel, labelCenterX, labelCenterY);
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

export function CaliperWorkbench({
  activeInstrument,
  onInstrumentChange,
  initialSession,
  onSessionChange,
}: CaliperWorkbenchProps) {
  const [scaleId, setScaleId] = useState<CaliperScaleId>(
    initialSession?.scaleId ?? "mm-0.05",
  );
  const [ticks, setTicks] = useState(() =>
    snapCaliperTicks(
      initialSession?.ticks ?? INITIAL_TICKS,
      initialSession?.scaleId ?? "mm-0.05",
    ),
  );
  const [answerVisible, setAnswerVisible] = useState(
    initialSession?.answerVisible ?? true,
  );
  const [mainScaleNumbersVisible, setMainScaleNumbersVisible] = useState(
    initialSession?.mainScaleNumbersVisible ?? true,
  );
  const [dragging, setDragging] = useState(false);
  const [movingAssemblyHovered, setMovingAssemblyHovered] = useState(false);
  const [detailMode, setDetailMode] = useState(false);
  const [detailAnchorTicks, setDetailAnchorTicks] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [brandingImage, setBrandingImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detailButtonRef = useRef<HTMLButtonElement>(null);
  const labRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<{ clientX: number; ticks: number } | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const lastMousePositionRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const scale = CALIPER_SCALES[scaleId];
  const unit = scale.unit;
  const scalesForUnit = useMemo(() => getCaliperScalesForUnit(unit), [unit]);
  const reading = formatCaliperReading(ticks, scale);
  const breakdown = formatBreakdown(ticks, scale);
  const convertedReading = formatOppositeUnitReading(ticks, unit);

  useEffect(() => {
    onSessionChange?.({
      scaleId,
      ticks,
      answerVisible,
      mainScaleNumbersVisible,
    });
  }, [
    answerVisible,
    mainScaleNumbersVisible,
    onSessionChange,
    scaleId,
    ticks,
  ]);

  const setReading = useCallback(
    (candidateTicks: number) => {
      setTicks(snapCaliperTicks(candidateTicks, scale));
    },
    [scale],
  );

  const closeDetail = useCallback(() => {
    setDetailMode(false);
    setDetailAnchorTicks(null);
    setAnnouncement("Ampliação fechada. Visualização geral restaurada.");
    window.requestAnimationFrame(() => detailButtonRef.current?.focus());
  }, []);

  const toggleDetail = () => {
    if (detailMode) {
      closeDetail();
      return;
    }

    setDetailAnchorTicks(ticks);
    setDetailMode(true);
    setAnnouncement(
      "Escala e nônio ampliados. O paquímetro continua ajustável por arraste, toque ou teclado.",
    );
    window.requestAnimationFrame(() => canvasRef.current?.focus());
  };

  useEffect(() => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => setBrandingImage(image);
    image.src = "/cavaleiro-samurai.png";

    return () => {
      image.onload = null;
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === labRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      drawInstrument(
        context,
        rect.width,
        rect.height,
        ticks,
        scale,
        dragging,
        detailMode,
        detailAnchorTicks,
        reading,
        answerVisible,
        mainScaleNumbersVisible,
        brandingImage,
      );
      const lastMousePosition = lastMousePositionRef.current;
      if (lastMousePosition && !dragging) {
        setMovingAssemblyHovered(
          isPointInMovingAssembly(
            lastMousePosition.clientX,
            lastMousePosition.clientY,
            rect,
            ticks,
            scale,
            detailMode,
            detailAnchorTicks,
          ),
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
  }, [
    ticks,
    scale,
    dragging,
    detailMode,
    detailAnchorTicks,
    reading,
    answerVisible,
    mainScaleNumbersVisible,
    brandingImage,
  ]);

  const pointerIsOnMovingAssembly = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return isPointInMovingAssembly(
      event.clientX,
      event.clientY,
      rect,
      ticks,
      scale,
      detailMode,
      detailAnchorTicks,
    );
  };

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const origin = dragOriginRef.current;
    if (!canvas || !origin) return;
    const rect = canvas.getBoundingClientRect();
    const layout = getInstrumentLayout(rect.width, rect.height, ticks, scale);
    const viewportLayout = detailMode
      ? getInstrumentLayout(
          rect.width,
          rect.height,
          detailAnchorTicks ?? ticks,
          scale,
        )
      : null;
    const zoom = viewportLayout
      ? getDetailViewport(rect.width, rect.height, viewportLayout, scale).zoom
      : 1;
    const deltaMillimetres =
      (event.clientX - origin.clientX) / (layout.pixelsPerMm * zoom);
    setReading(origin.ticks + mmToTicks(deltaMillimetres));
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
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    dragOriginRef.current = { clientX: event.clientX, ticks };
    setDragging(true);
    setMovingAssemblyHovered(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event);
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
  };

  const onLostPointerCapture = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    dragOriginRef.current = null;
    setDragging(false);
    setMovingAssemblyHovered(false);
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

  const toggleMainScaleNumbers = () => {
    setMainScaleNumbersVisible((visible) => {
      setAnnouncement(
        visible
          ? "Números da escala principal ocultados. Os traços permanecem visíveis."
          : "Números da escala principal exibidos.",
      );
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
    <div className="lab-shell" ref={labRef}>
      <header className="lab-header">
        <a className="brand" href="#simulador" aria-label="Cabalero Automações — início">
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

      <section className="workbench" id="simulador" aria-labelledby="instrument-title">
        <div className="stage-copy">
          <div>
            <p className="eyebrow">Laboratório de metrologia</p>
            <h1 id="instrument-title">Paquímetro universal com nônio</h1>
            <InstrumentSelector
              className="stage-instrument-picker"
              compactLabel
              activeInstrument={activeInstrument}
              onInstrumentChange={onInstrumentChange}
            />
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

        <div className="instrument-stage" data-detail={detailMode}>
          <button
            className="scale-numbers-control"
            type="button"
            data-hidden={!mainScaleNumbersVisible}
            aria-controls="caliper-canvas"
            aria-pressed={!mainScaleNumbersVisible}
            aria-label={
              mainScaleNumbersVisible
                ? "Ocultar números da escala principal"
                : "Mostrar números da escala principal"
            }
            title={
              mainScaleNumbersVisible
                ? "Ocultar números da escala principal"
                : "Mostrar números da escala principal"
            }
            onClick={toggleMainScaleNumbers}
          >
            <span className="scale-numbers-symbol" aria-hidden="true">123</span>
          </button>

          <button
            ref={detailButtonRef}
            className={`detail-control${detailMode ? " is-active" : ""}`}
            type="button"
            aria-controls="caliper-canvas"
            aria-expanded={detailMode}
            aria-pressed={detailMode}
            aria-label={detailMode ? "Fechar ampliação" : "Ampliar escala e nônio"}
            title={detailMode ? "Fechar ampliação (Esc)" : "Ampliar escala e nônio"}
            onClick={toggleDetail}
          >
            {detailMode ? (
              <span className="close-symbol" aria-hidden="true" />
            ) : (
              <span className="magnifier-symbol" aria-hidden="true" />
            )}
          </button>

          <canvas
            id="caliper-canvas"
            ref={canvasRef}
            className={`caliper-canvas${movingAssemblyHovered ? " is-interactive" : ""}${dragging ? " is-dragging" : ""}`}
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
            onLostPointerCapture={onLostPointerCapture}
            onPointerLeave={() => {
              if (!dragging) {
                lastMousePositionRef.current = null;
                setMovingAssemblyHovered(false);
              }
            }}
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
                aria-label="Milímetro (mm)"
                data-active={unit === "mm"}
                aria-pressed={unit === "mm"}
                onClick={() => changeUnit("mm")}
              >
                <span className="unit-name">Milímetro</span>
                <span className="unit-symbol">mm</span>
              </button>
              <button
                type="button"
                aria-label="Polegada (in)"
                data-active={unit === "in"}
                aria-pressed={unit === "in"}
                onClick={() => changeUnit("in")}
              >
                <span className="unit-name">Polegada</span>
                <span className="unit-symbol">in</span>
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

          <output
            className="conversion-output"
            data-hidden={!answerVisible}
            aria-label={
              answerVisible
                ? `Conversão automática de ${unit === "mm" ? "milímetros para polegadas" : "polegadas para milímetros"}: ${convertedReading}`
                : "Conversão automática oculta junto com a resposta"
            }
          >
            <span>Conversão {unit === "mm" ? "mm → in" : "in → mm"}</span>
            <strong>{answerVisible ? convertedReading : "••••"}</strong>
          </output>

          <div className="practice-actions">
            <button className="secondary-button" type="button" onClick={() => setReading(0)}>
              <span className="button-icon" aria-hidden="true">↺</span> Fechar
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

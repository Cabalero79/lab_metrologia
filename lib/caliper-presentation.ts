import type { CaliperScaleId, MeasurementUnit } from "./caliper";

export type TickDirection = -1 | 1;

export const CALIPER_SCALE_LEGIBILITY = {
  minimumDetailPitchPx: 3,
  minimumDetailFontPx: 14,
  minimumOverviewFontPx: 9,
  minimumLabelGapPx: 2,
} as const;

export interface ScalePresentationLandmarks {
  readonly beamY: number;
  readonly beamHeight: number;
  readonly sliderTop: number;
  readonly upperPlateBottom: number;
  readonly vernierTop: number;
  readonly vernierBottom: number;
}

export interface ScalePresentation {
  readonly mainTickBaselineY: number;
  readonly mainTickDirection: TickDirection;
  readonly mainLabelY: number;
  readonly unitLabelY: number;
  readonly vernierPlate: "upper" | "lower";
  readonly vernierTickBaselineY: number;
  readonly vernierTickDirection: TickDirection;
  readonly vernierLabelY: number;
  readonly detailFocusY: number;
}

/**
 * Define a distribuição dos números do nônio sem remover nenhuma divisão.
 * O perfil fracionário segue a convenção didática 0–4–8 da referência.
 */
export function getVernierLabelInterval(
  scaleId: CaliperScaleId,
  vernierDivisions: number,
  vernierStepPx: number,
  minimumLabelWidthPx = 12,
): number {
  const baseInterval =
    scaleId === "in-1/128"
      ? 4
      : vernierDivisions <= 10
      ? 1
      : vernierDivisions === 20
        ? 2
        : 5;
  const minimumInterval = Math.max(
    baseInterval,
    Math.ceil(minimumLabelWidthPx / vernierStepPx),
  );

  return Array.from(
    { length: vernierDivisions / baseInterval },
    (_, index) => (index + 1) * baseInterval,
  ).find(
    (candidate) =>
      candidate >= minimumInterval && vernierDivisions % candidate === 0,
  ) ?? vernierDivisions;
}

export function getCaliperDetailZoom(
  viewportWidth: number,
  vernierStepPx: number,
  horizontalFitZoom: number,
): number {
  const maximumZoom = viewportWidth < 500 ? 5.2 : viewportWidth < 900 ? 3.6 : 2.8;
  const minimumPitchZoom =
    CALIPER_SCALE_LEGIBILITY.minimumDetailPitchPx /
    Math.max(0.1, vernierStepPx);

  return Math.min(
    maximumZoom,
    Math.max(1.55, horizontalFitZoom, minimumPitchZoom),
  );
}

/**
 * Define somente a projeção vertical das escalas. O modelo metrológico,
 * o alinhamento horizontal e a quantização permanecem em `caliper.ts`.
 */
export function getScalePresentation(
  unit: MeasurementUnit,
  landmarks: ScalePresentationLandmarks,
): ScalePresentation {
  const {
    beamY,
    beamHeight,
    sliderTop,
    upperPlateBottom,
    vernierTop,
    vernierBottom,
  } = landmarks;

  if (unit === "in") {
    const scaleSeamY = upperPlateBottom;
    return {
      mainTickBaselineY: scaleSeamY,
      mainTickDirection: 1,
      mainLabelY: beamY + beamHeight * 0.72,
      unitLabelY: beamY + beamHeight * 0.95,
      vernierPlate: "upper",
      vernierTickBaselineY: scaleSeamY,
      vernierTickDirection: -1,
      vernierLabelY: Math.min(
        upperPlateBottom - 3,
        Math.max(
          sliderTop + beamHeight * 0.18,
          upperPlateBottom - beamHeight * 0.35,
        ),
      ),
      detailFocusY: scaleSeamY,
    };
  }

  const scaleSeamY = vernierTop;
  return {
    mainTickBaselineY: scaleSeamY,
    mainTickDirection: -1,
    mainLabelY: beamY + beamHeight * 0.4,
    // Keep the unit baseline clear of the beam's upper edge even when the
    // canvas is compressed in mobile landscape.
    unitLabelY: beamY + beamHeight * 0.22,
    vernierPlate: "lower",
    vernierTickBaselineY: scaleSeamY,
    vernierTickDirection: 1,
    vernierLabelY:
      vernierBottom - Math.min(6, (vernierBottom - vernierTop) * 0.25),
    detailFocusY: scaleSeamY,
  };
}

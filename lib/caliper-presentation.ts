import type { CaliperScaleId, MeasurementUnit } from "./caliper";

export type TickDirection = -1 | 1;

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
): number {
  if (scaleId === "in-1/128") return 4;

  const baseInterval =
    vernierDivisions <= 10
      ? 1
      : vernierDivisions === 20
        ? 2
        : 5;
  const minimumInterval = Math.max(
    baseInterval,
    Math.ceil(12 / vernierStepPx),
  );

  return Array.from(
    { length: vernierDivisions / baseInterval },
    (_, index) => (index + 1) * baseInterval,
  ).find(
    (candidate) =>
      candidate >= minimumInterval && vernierDivisions % candidate === 0,
  ) ?? vernierDivisions;
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
      vernierLabelY: Math.max(
        sliderTop + 13,
        upperPlateBottom - beamHeight * 0.35,
      ),
      detailFocusY: scaleSeamY,
    };
  }

  const scaleSeamY = vernierTop;
  return {
    mainTickBaselineY: scaleSeamY,
    mainTickDirection: -1,
    mainLabelY: beamY + beamHeight * 0.4,
    unitLabelY: beamY + beamHeight * 0.16,
    vernierPlate: "lower",
    vernierTickBaselineY: scaleSeamY,
    vernierTickDirection: 1,
    vernierLabelY: vernierBottom - 6,
    detailFocusY: scaleSeamY,
  };
}

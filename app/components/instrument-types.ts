export type InstrumentId = "caliper" | "internal-micrometer";

export interface InstrumentNavigationProps {
  readonly activeInstrument: InstrumentId;
  readonly onInstrumentChange: (instrument: InstrumentId) => void;
}


export const INSTRUMENT_OPTIONS = [
  { id: "caliper", label: "Paquímetro universal" },
  { id: "internal-micrometer", label: "Micrômetro interno" },
  { id: "external-micrometer", label: "Micrômetro externo" },
  { id: "semicircular-protractor", label: "Transferidor semicircular" },
] as const;

export type InstrumentId = (typeof INSTRUMENT_OPTIONS)[number]["id"];

export interface InstrumentNavigationProps {
  readonly activeInstrument: InstrumentId;
  readonly onInstrumentChange: (instrument: InstrumentId) => void;
}

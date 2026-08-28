import {
  INSTRUMENT_OPTIONS,
  type InstrumentId,
  type InstrumentNavigationProps,
} from "./instrument-types";

interface InstrumentSelectorProps extends InstrumentNavigationProps {
  readonly className?: string;
  readonly compactLabel?: boolean;
}

export function InstrumentSelector({
  activeInstrument,
  onInstrumentChange,
  className = "instrument-picker",
  compactLabel = false,
}: InstrumentSelectorProps) {
  return (
    <label className={className}>
      <span>Instrumento</span>
      <select
        aria-label={
          compactLabel
            ? "Instrumento de medição na bancada"
            : "Instrumento de medição"
        }
        value={activeInstrument}
        onChange={(event) =>
          onInstrumentChange(event.target.value as InstrumentId)
        }
      >
        {INSTRUMENT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

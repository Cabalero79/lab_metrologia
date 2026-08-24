"use client";

import { useCallback, useState } from "react";

import { mmToTicks } from "../../lib/caliper";
import { CaliperWorkbench, type CaliperSessionState } from "./CaliperWorkbench";
import {
  InternalMicrometerWorkbench,
  type InternalMicrometerSessionState,
} from "./InternalMicrometerWorkbench";
import type { InstrumentId } from "./instrument-types";

const DEFAULT_CALIPER_SESSION: CaliperSessionState = {
  scaleId: "mm-0.05",
  ticks: mmToTicks(58.35),
  answerVisible: true,
  mainScaleNumbersVisible: true,
};

const DEFAULT_MICROMETER_SESSION: InternalMicrometerSessionState = {
  ticks: 736,
  answerVisible: true,
  scaleNumbersVisible: true,
};

export function MetrologyLab() {
  const [activeInstrument, setActiveInstrument] =
    useState<InstrumentId>("caliper");
  const [announcement, setAnnouncement] = useState("");
  const [caliperSession, setCaliperSession] = useState(DEFAULT_CALIPER_SESSION);
  const [micrometerSession, setMicrometerSession] = useState(
    DEFAULT_MICROMETER_SESSION,
  );

  const changeInstrument = useCallback((instrument: InstrumentId) => {
    setActiveInstrument(instrument);
    setAnnouncement(
      instrument === "caliper"
        ? "Paquímetro universal selecionado."
        : "Micrômetro interno selecionado.",
    );
  }, []);

  return (
    <main className="metrology-lab">
      {activeInstrument === "caliper" ? (
        <CaliperWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={caliperSession}
          onSessionChange={setCaliperSession}
        />
      ) : (
        <InternalMicrometerWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={micrometerSession}
          onSessionChange={setMicrometerSession}
        />
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </main>
  );
}

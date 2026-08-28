"use client";

import { useCallback, useState, type ReactNode } from "react";

import { mmToTicks } from "../../lib/caliper";
import { CaliperWorkbench, type CaliperSessionState } from "./CaliperWorkbench";
import {
  ExternalMicrometerWorkbench,
  type ExternalMicrometerSessionState,
} from "./ExternalMicrometerWorkbench";
import {
  InternalMicrometerWorkbench,
  type InternalMicrometerSessionState,
} from "./InternalMicrometerWorkbench";
import {
  SemicircularProtractorWorkbench,
  type SemicircularProtractorSessionState,
} from "./SemicircularProtractorWorkbench";
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

const DEFAULT_EXTERNAL_MICROMETER_SESSION: ExternalMicrometerSessionState = {
  ticks: 10_000,
  profileId: "external-mm-0.001",
  answerVisible: true,
  scaleNumbersVisible: true,
};

const DEFAULT_PROTRACTOR_SESSION: SemicircularProtractorSessionState = {
  arcMinutes: 30 * 60 + 25,
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
  const [externalMicrometerSession, setExternalMicrometerSession] = useState(
    DEFAULT_EXTERNAL_MICROMETER_SESSION,
  );
  const [protractorSession, setProtractorSession] = useState(
    DEFAULT_PROTRACTOR_SESSION,
  );

  const changeInstrument = useCallback((instrument: InstrumentId) => {
    setActiveInstrument(instrument);
    const labels: Record<InstrumentId, string> = {
      caliper: "Paquímetro universal selecionado.",
      "internal-micrometer": "Micrômetro interno selecionado.",
      "external-micrometer": "Micrômetro externo selecionado.",
      "semicircular-protractor": "Transferidor semicircular selecionado.",
    };
    setAnnouncement(labels[instrument]);
  }, []);

  let activeWorkbench: ReactNode;
  switch (activeInstrument) {
    case "caliper":
      activeWorkbench = (
        <CaliperWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={caliperSession}
          onSessionChange={setCaliperSession}
        />
      );
      break;
    case "internal-micrometer":
      activeWorkbench = (
        <InternalMicrometerWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={micrometerSession}
          onSessionChange={setMicrometerSession}
        />
      );
      break;
    case "external-micrometer":
      activeWorkbench = (
        <ExternalMicrometerWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={externalMicrometerSession}
          onSessionChange={setExternalMicrometerSession}
        />
      );
      break;
    case "semicircular-protractor":
      activeWorkbench = (
        <SemicircularProtractorWorkbench
          activeInstrument={activeInstrument}
          onInstrumentChange={changeInstrument}
          initialSession={protractorSession}
          onSessionChange={setProtractorSession}
        />
      );
      break;
    default: {
      const exhaustiveCheck: never = activeInstrument;
      activeWorkbench = exhaustiveCheck;
    }
  }

  return (
    <main className="metrology-lab">
      {activeWorkbench}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </main>
  );
}

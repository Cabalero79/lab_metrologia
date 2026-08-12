import type { Metadata } from "next";

import { CaliperWorkbench } from "./components/CaliperWorkbench";

export const metadata: Metadata = {
  title: "Paquímetro Universal Virtual",
  description:
    "Simulador didático de paquímetro universal com nônio em milímetros e polegadas.",
};

export default function Home() {
  return <CaliperWorkbench />;
}

import type { Metadata } from "next";

import { MetrologyLab } from "./components/MetrologyLab";

export const metadata: Metadata = {
  title: "Paquímetro Universal Virtual | Micrômetro Interno",
  description:
    "Laboratório didático de paquímetro universal e micrômetro interno para estudos de metrologia.",
};

export default function Home() {
  return <MetrologyLab />;
}

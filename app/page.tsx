import type { Metadata } from "next";

import { MetrologyLab } from "./components/MetrologyLab";

export const metadata: Metadata = {
  title: "Paquímetro, Micrômetros e Transferidor Virtual",
  description:
    "Laboratório didático de paquímetro universal, micrômetros interno e externo e transferidor semicircular para estudos de metrologia.",
};

export default function Home() {
  return <MetrologyLab />;
}

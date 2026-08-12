import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cabalero-automacoes.example"),
  title: {
    default: "Cabalero_Automações — Laboratório de Metrologia",
    template: "%s | Cabalero_Automações",
  },
  description:
    "Engenharia de Software aplicada à Indústria: instrumentos de medição virtuais, precisos e didáticos.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Paquímetro Universal Virtual | Cabalero_Automações",
    description:
      "Aprenda metrologia manipulando um paquímetro universal com nônio em milímetros e polegadas.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Paquímetro universal virtual da Cabalero_Automações",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

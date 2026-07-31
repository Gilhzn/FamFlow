import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Rubik } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Inter has no Hebrew glyphs — Rubik covers them in the font-sans fallback chain.
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-hebrew" });

export const metadata: Metadata = {
  title: "FamFinance AI",
  description:
    "Autonomous family expense & payment hub — live ledger, AI vision entry, predictive runway.",
};

export const viewport: Viewport = {
  themeColor: "#f5f6f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${rubik.variable}`}>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

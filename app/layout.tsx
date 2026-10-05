import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import Nav from "@/components/layout/Nav";
import PaletteDriver from "@/components/layout/PaletteDriver";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { SITE } from "@/lib/constants";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: "Darvin Raj — I build AI that knows its limits",
    template: "%s — Darvin Raj",
  },
  description: "Darvin Raj is a full-stack engineer building AI that knows its limits.",
  openGraph: {
    title: "Darvin Raj — I build AI that knows its limits",
    description:
      "Full-stack engineer based in Kuala Lumpur. AI that recommends, guardrails that enforce, humans that approve.",
    type: "website",
    url: "/",
    siteName: "Darvin Raj",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darvin Raj — I build AI that knows its limits",
    description:
      "Full-stack engineer based in Kuala Lumpur. AI that recommends, guardrails that enforce, humans that approve.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <SmoothScroll>
          <PaletteDriver />
          <Nav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}

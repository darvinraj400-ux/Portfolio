import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { SoundProvider } from "@/components/audio/SoundProvider";
import Nav from "@/components/layout/Nav";
import PullChain from "@/components/layout/PullChain";
import SmoothScroll from "@/components/layout/SmoothScroll";
import CursorInstrument from "@/components/motion/CursorInstrument";
import { MotionPreferenceProvider } from "@/components/providers/MotionPreferenceProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Footer from "@/components/sections/Footer";
import { SITE } from "@/lib/constants";
import { PROJECT_COUNT } from "@/lib/projects";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const title = "DARVINN STUDIO — Darvin Raj, Independent Digital Creator";
const description =
  "DARVINN STUDIO is the portfolio of Darvin Raj, an independent digital creator working across web development, AI-assisted development, UI/UX design and automation. Selected work spans websites, digital products, AI and business systems.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: title,
    template: "%s — DARVINN STUDIO",
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: SITE.studio,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background font-sans">
        <MotionPreferenceProvider>
          <ThemeProvider>
            <SoundProvider>
              <SmoothScroll>
                <a href="#main-content" className="skip-link">
                  Skip to content
                </a>
                <Nav projectCount={PROJECT_COUNT} />
                {children}
                <Footer />
              </SmoothScroll>
              <PullChain />
            </SoundProvider>
          </ThemeProvider>
          <CursorInstrument />
        </MotionPreferenceProvider>
      </body>
    </html>
  );
}

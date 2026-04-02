import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Preloader from "./components/Preloader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mars AI — Unfiltered Intelligence",
  description: "A sovereign reasoning engine built for radical honesty and unrestricted human inquiry. No filters. No walls. Powered by Groq.",
  icons: {
    icon: '/mars-logo.svg',
    shortcut: '/mars-logo.svg',
    apple: '/mars-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark`}>
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans overflow-x-hidden">
        <Preloader />
        {children}
      </body>
    </html>
  );
}

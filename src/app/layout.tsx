import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AuraTracker - Traccia l'aura dei tuoi amici",
  description: "Webapp per tracciare l'aura dei giocatori in partite competitive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

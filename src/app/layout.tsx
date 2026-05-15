import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AutoSyncHandler } from "@/components/AutoSyncHandler";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Body Insight AI",
  description: "Personal health dashboard with AI insights",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans bg-[var(--surface-0)] min-h-screen antialiased">
        <Navigation />
        <AutoSyncHandler />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

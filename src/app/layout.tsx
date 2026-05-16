import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AutoSyncHandler } from "@/components/AutoSyncHandler";
import { FirestoreSync } from "@/components/FirestoreSync";

// Medical Clean 계열: 한국어 커버리지 + 클린 헬스케어 느낌
const notoSansKr = Noto_Sans_KR({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-kr",
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
    <html lang="ko" className={notoSansKr.variable}>
      <body className="font-sans bg-[var(--surface-0)] min-h-screen antialiased">
        <Navigation />
        <AutoSyncHandler />
        <FirestoreSync />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

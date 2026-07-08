import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/ui/ThemeProvider";
import ToastProvider from "../components/realtime/ToastProvider";
import { LiveTicker } from "../components/realtime/LiveTicker";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import ServiceWorkerRegister from "../components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "VANGUARD",
  description: "The Collegiate Sports Operating Ecosystem — live scores, fixtures and standings.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VANGUARD",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0E10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen bg-vanguard-charcoal text-zinc-100 antialiased">
        <Providers>
          <ToastProvider>
            <Header />
            <LiveTicker />
            <main className="max-w-5xl mx-auto px-4 sm:px-5 pt-5 pb-28 md:pb-16">{children}</main>
            <BottomNav />
          </ToastProvider>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

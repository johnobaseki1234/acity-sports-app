import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "../components/ui/ThemeProvider";
import ToastProvider from "../components/realtime/ToastProvider";
import { LiveTicker } from "../components/realtime/LiveTicker";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import ServiceWorkerRegister from "../components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Acity Sports Center",
  description: "Live real-time operational tournament event matches portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Acity Sports",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
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
      <body className="relative min-h-screen text-gray-900 dark:text-zinc-50 antialiased bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 transition-colors duration-300">
        {/* Decorative background layer */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div
            className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-3xl"
            style={{ animation: "floatBlob 14s ease-in-out infinite" }}
          />
          <div
            className="absolute top-1/3 -left-24 h-96 w-96 rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-3xl"
            style={{ animation: "floatBlob 18s ease-in-out infinite reverse" }}
          />
          <div
            className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-purple-400/10 dark:bg-purple-600/10 blur-3xl"
            style={{ animation: "floatBlob 20s ease-in-out infinite" }}
          />
        </div>

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

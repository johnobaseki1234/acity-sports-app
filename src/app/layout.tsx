import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/ui/ThemeProvider";
import ToastProvider from "../components/realtime/ToastProvider";
import { LiveTicker } from "../components/realtime/LiveTicker";
import Header from "../components/layout/Header";

export const metadata: Metadata = {
  title: "Acity Sports Center",
  description: "Live real-time operational tournament event matches portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 min-h-screen transition-colors duration-200 antialiased">
        <Providers>
          <ToastProvider>
            <Header />
            <LiveTicker />
            <main className="max-w-2xl mx-auto px-4 pb-16 pt-4">{children}</main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

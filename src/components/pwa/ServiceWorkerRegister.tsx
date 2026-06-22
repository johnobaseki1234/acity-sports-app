"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // We cast window as 'any' so TypeScript stops shouting about workbox
    const win = window as any;

    if ("serviceWorker" in navigator && win.workbox !== undefined) {
      const wb = win.workbox;

      // This listener fires when a new update is found and waiting to install
      wb.addEventListener("waiting", () => {
        wb.addEventListener("controlling", () => {
          window.location.reload();
        });
        wb.messageSkipWaiting();
      });

      wb.register();
    }
  }, []);

  return null;
}
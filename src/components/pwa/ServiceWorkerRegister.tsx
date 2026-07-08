"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("✅ Service Worker registered");

        // Check immediately
        registration.update();

        // Check every minute
        setInterval(() => {
          registration.update();
        }, 60000);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;

          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("🚀 New version available");

              window.location.reload();
            }
          });
        });

      } catch (err) {
        console.error("SW Registration failed", err);
      }
    };

    // `load` may have already fired before this effect runs (e.g. once
    // hydration finishes on a client-rendered route) — in that case the
    // listener below would never fire and the SW would silently never
    // register or pick up updates. Register immediately when that's the case.
    if (document.readyState === "complete") {
      registerSW();
      return;
    }

    window.addEventListener("load", registerSW);

    return () => {
      window.removeEventListener("load", registerSW);
    };
  }, []);

  return null;
}
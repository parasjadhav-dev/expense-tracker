"use client";

import { useEffect } from "react";

// Registers /sw.js, the small service worker that shows an offline page when a
// page cannot be loaded. Production only: in development it would get in the way
// of hot reloading.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // The app works the same without it. Nothing to tell the user.
    });
  }, []);
  return null;
}

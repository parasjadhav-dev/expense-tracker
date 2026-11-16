"use client";

import { useEffect } from "react";

const LIGHT = "#ffffff";
const DARK = "#09090b";

// Keeps the browser/status-bar colour (<meta name="theme-color">) in step with the
// app's own light/dark switch. The layout declares one colour per system setting,
// which is wrong when someone picks the other theme by hand (system light, app
// dark). This sets them all to the colour of the theme actually showing, now and
// whenever the theme changes or Next adds fresh tags during navigation.
export function ThemeColorSync() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const color = root.classList.contains("dark") ? DARK : LIGHT;
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        if (meta.getAttribute("content") !== color) meta.setAttribute("content", color);
      });
    };
    apply();

    // The theme switch adds or removes the "dark" class on <html>.
    const classes = new MutationObserver(apply);
    classes.observe(root, { attributes: true, attributeFilter: ["class"] });
    // Next streams metadata in and replaces it on navigation: re-apply when a new
    // theme-color tag shows up.
    const tags = new MutationObserver((records) => {
      const added = records.some((record) =>
        Array.from(record.addedNodes).some((node) => node.nodeName === "META"),
      );
      if (added) apply();
    });
    tags.observe(root, { childList: true, subtree: true });

    return () => {
      classes.disconnect();
      tags.disconnect();
    };
  }, []);

  return null;
}

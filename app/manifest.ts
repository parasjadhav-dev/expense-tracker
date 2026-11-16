import type { MetadataRoute } from "next";

// The web app manifest: what makes the site installable ("Add to Home screen" /
// "Install app"). Next serves it at /manifest.webmanifest and links it from every
// page. The icons are drawn from the logo and live in public/icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Expense Tracker",
    short_name: "Expenses",
    description:
      "A budget-focused expense tracker with category budgets, overspend alerts and a daily safe-to-spend number.",
    // Opens on the dashboard. Someone who is logged out is sent to the login page
    // and back again afterwards.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6fa",
    theme_color: "#ffffff",
    lang: "en",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops this one to a circle or rounded square, so it is full-bleed.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home-screen icon for these.
    shortcuts: [
      {
        name: "Add expense",
        short_name: "Add",
        url: "/expenses/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Budgets",
        url: "/budgets",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

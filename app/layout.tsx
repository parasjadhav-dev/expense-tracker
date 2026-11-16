import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { ThemeColorSync } from "@/components/pwa/theme-color-sync";
import "./globals.css";

// Inter is the UI font. It registers as --font-sans, which globals.css maps to
// the Tailwind `font-sans` utility.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Expense Tracker",
  title: "Expense Tracker",
  description:
    "A budget-focused expense tracker with category budgets, overspend alerts and daily safe-to-spend.",
  // When installed on an iPhone: opens full screen, with this name under the icon.
  appleWebApp: { capable: true, title: "Expenses", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

// The colour of the phone's status bar / browser bar, matching the app's top bar
// in light and dark. (ThemeColorSync keeps it in step with the app's own switch.)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Runs before the first paint so the page never flashes the wrong theme: use
// the saved choice, otherwise the system setting.
const THEME_SCRIPT = `try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
        <ThemeColorSync />
      </body>
    </html>
  );
}
